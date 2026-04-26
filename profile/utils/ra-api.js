/**
 * RetroAchievements API client — browser-side, no build step.
 *
 * Two layers:
 *   1. Raw endpoint wrappers (one per RA API endpoint) — pure fetch + camelCase map, no cache.
 *   2. App-level composites (fetchProfile, fetchAchievementsChunk, fetchBacklog,
 *      fetchGameDetails, validateCredentials) — compose raw calls, add sessionStorage cache.
 *
 * Auth:  credentials are stored in localStorage as { username, apiKey }.
 * Cache: sessionStorage, 5-minute TTL, key per function + username [+ gameId / chunkIndex].
 * Rate:  same-endpoint paginated loops sleep 1 s between pages.
 *
 * Docs: https://api-docs.retroachievements.org/
 */

const RA_BASE = 'https://retroachievements.org/API';

// ── Credentials ───────────────────────────────────────────────────────────────

export function getCredentials() {
  try {
    const s = localStorage.getItem('raCredentials');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function clearCredentials() {
  localStorage.removeItem('raCredentials');
}

// ── Session cache (5 min TTL) ─────────────────────────────────────────────────

export const CACHE_TTL = 1 * 60 * 1000;

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

// ── Local cache (custom TTL, persists across sessions) ────────────────────────

const LOCAL_CACHE_TTL_24H = 24 * 60 * 60 * 1000;

function lcacheGet(key, ttl = LOCAL_CACHE_TTL_24H) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function lcacheSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

// ── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry(fn, retries = 2, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) {
      if (e.message === 'AUTH_ERROR') throw e;
      lastErr = e;
      if (i < retries) {
        const wait = e.message === 'HTTP 429' ? delayMs * 3 : delayMs;
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// ── Debug logging ─────────────────────────────────────────────────────────────

function debugLog(entry) {
  if (localStorage.getItem('raDebugMode') !== 'true') return;
  if (!window.__raDebugLog) window.__raDebugLog = [];
  window.__raDebugLog.push(entry);
}

// ── Core ──────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function raFetch(endpoint, username, apiKey, params = {}) {
  const url = new URL(`${RA_BASE}/${endpoint}`);
  url.searchParams.set('z', username);
  url.searchParams.set('y', apiKey);
  for (const [k, v] of Object.entries(params))
    url.searchParams.set(k, String(v));

  const t0 = Date.now();
  const safeParams = { ...params, y: '***' };

  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    debugLog({ endpoint, params: safeParams, status: 'network_error', error: e.message, ms: Date.now() - t0, ts: Date.now() });
    throw e;
  }

  if (res.status === 401) {
    debugLog({ endpoint, params: safeParams, status: 401, error: 'AUTH_ERROR', ms: Date.now() - t0, ts: Date.now() });
    throw new Error('AUTH_ERROR');
  }
  if (!res.ok) {
    debugLog({ endpoint, params: safeParams, status: res.status, error: `HTTP ${res.status}`, ms: Date.now() - t0, ts: Date.now() });
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data?.message === 'Credentials are required.' || data?.status === 401) {
    debugLog({ endpoint, params: safeParams, status: 401, error: 'AUTH_ERROR', ms: Date.now() - t0, ts: Date.now() });
    throw new Error('AUTH_ERROR');
  }

  debugLog({ endpoint, params: safeParams, status: res.status, data, ms: Date.now() - t0, ts: Date.now() });
  return data;
}

// Paginate a Results-based endpoint, sleeping 1 s between pages.
async function paginate(endpoint, username, apiKey, extraParams = {}, pageSize = 500) {
  const all = [];
  let offset = 0;
  while (true) {
    const data = await raFetch(endpoint, username, apiKey,
      { u: username, c: pageSize, o: offset, ...extraParams });
    const results = data.Results || [];
    all.push(...results);
    if (all.length >= (data.Total || 0) || results.length < pageSize) break;
    offset += pageSize;
    await sleep(1000);
  }
  return all;
}

// ── Shared mappers ────────────────────────────────────────────────────────────

function mapAchievementUnlock(r) {
  return {
    date:          r.Date,
    hardcoreMode:  r.HardcoreMode === 1 || r.HardcoreMode === '1',
    achievementId: r.AchievementID,
    title:         r.Title,
    description:   r.Description  || '',
    badgeName:     r.BadgeName,
    points:        r.Points        || 0,
    trueRatio:     r.TrueRatio     || 0,
    type:          r.Type          || null,
    gameId:        r.GameID,
    gameTitle:     r.GameTitle,
    gameIcon:      r.GameIcon,
    consoleName:   r.ConsoleName,
  };
}

function mapClaim(c) {
  return {
    id:          c.ID,
    user:        c.User,
    ulid:        c.ULID,
    gameId:      c.GameID,
    gameTitle:   c.GameTitle,
    gameIcon:    c.GameIcon,
    consoleId:   c.ConsoleID,
    consoleName: c.ConsoleName,
    claimType:   c.ClaimType,
    setType:     c.SetType,
    status:      c.Status,
    extension:   c.Extension,
    special:     c.Special,
    created:     c.Created,
    doneTime:    c.DoneTime,
    updated:     c.Updated,
    userIsJrDev: c.UserIsJrDev,
    minutesLeft: c.MinutesLeft,
  };
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── USER ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetUserProfile — basic profile info.
 * Params: { u }
 */
export async function getUserProfile(username, apiKey, { u } = {}) {
  const raw = await raFetch('API_GetUserProfile.php', username, apiKey, { u: u || username });
  return {
    user:               raw.User,
    ulid:               raw.ULID,
    userPic:            raw.UserPic,
    memberSince:        raw.MemberSince,
    richPresenceMsg:    raw.RichPresenceMsg    || '',
    lastGameId:         raw.LastGameID,
    contribCount:       raw.ContribCount       || 0,
    contribYield:       raw.ContribYield       || 0,
    totalPoints:        raw.TotalPoints        || 0,
    totalSoftcorePoints: raw.TotalSoftcorePoints || 0,
    totalTruePoints:    raw.TotalTruePoints    || 0,
    permissions:        raw.Permissions,
    untracked:          raw.Untracked,
    id:                 raw.ID,
    userWallActive:     raw.UserWallActive,
    motto:              raw.Motto              || '',
  };
}

/**
 * API_GetUserSummary — profile + recently played + recent achievements.
 * Params: { u, g (recently played count, default 10), a (recent achievements count, default 5) }
 */
export async function getUserSummary(username, apiKey, { u, g = 10, a = 5 } = {}) {
  const raw = await raFetch('API_GetUserSummary.php', username, apiKey,
    { u: u || username, g, a });
  return {
    user:               raw.User,
    ulid:               raw.ULID,
    memberSince:        raw.MemberSince,
    lastActivity:       raw.LastActivity       || null,
    richPresenceMsg:    raw.RichPresenceMsg    || '',
    richPresenceMsgDate: raw.RichPresenceMsgDate || null,
    lastGameId:         raw.LastGameID,
    contribCount:       raw.ContribCount       || 0,
    contribYield:       raw.ContribYield       || 0,
    totalPoints:        raw.TotalPoints        || 0,
    totalSoftcorePoints: raw.TotalSoftcorePoints || 0,
    totalTruePoints:    raw.TotalTruePoints    || 0,
    permissions:        raw.Permissions,
    untracked:          raw.Untracked,
    id:                 raw.ID,
    userWallActive:     raw.UserWallActive,
    motto:              raw.Motto              || '',
    rank:               raw.Rank,
    softcoreRank:       raw.SoftcoreRank       || null,
    totalRanked:        raw.TotalRanked,
    status:             raw.Status,
    userPic:            raw.UserPic,
    recentlyPlayedCount: raw.RecentlyPlayedCount || 0,
    recentlyPlayed:     (raw.RecentlyPlayed || []).map(g => ({
      gameId:           g.GameID,
      title:            g.Title,
      consoleName:      g.ConsoleName,
      lastPlayed:       g.LastPlayed,
      imageIcon:        g.ImageIcon,
      imageIngame:      g.ImageIngame   || null,
      imageTitle:       g.ImageTitle    || null,
      numAchieved:      g.NumAchieved   || 0,
      numPossibleAchievements: g.AchievementsTotal || 0,
    })),
    awarded:            raw.Awarded            || {},
    recentAchievements: raw.RecentAchievements || {},
    lastGame:           raw.LastGame           || null,
  };
}

/**
 * API_GetUserPoints — current hardcore + softcore point totals.
 * Params: { u }
 */
export async function getUserPoints(username, apiKey, { u } = {}) {
  const raw = await raFetch('API_GetUserPoints.php', username, apiKey, { u: u || username });
  return {
    points:          raw.Points          || 0,
    softcorePoints:  raw.SoftcorePoints  || 0,
  };
}

/**
 * API_GetUserCompletionProgress — paginated list of all games the user has touched.
 * Returns all pages merged. Params: { u }
 */
export async function getUserCompletionProgress(username, apiKey, { u } = {}) {
  const results = await paginate('API_GetUserCompletionProgress.php', username, apiKey,
    { u: u || username });
  return results.map(r => ({
    gameId:                r.GameID,
    title:                 r.Title,
    consoleName:           r.ConsoleName,
    imageIcon:             r.ImageIcon,
    numAwarded:            r.NumAwarded            || 0,
    numAwardedHardcore:    r.NumAwardedHardcore     || 0,
    maxPossible:           r.MaxPossible            || 0,
    highestAwardKind:      r.HighestAwardKind       || null,
    highestAwardDate:      r.HighestAwardDate       || null,
    mostRecentAwardedDate: r.MostRecentAwardedDate  || null,
  }));
}

/**
 * API_GetUserCompletedGames — legacy endpoint, prefer getUserCompletionProgress.
 * Params: { u }
 */
export async function getUserCompletedGames(username, apiKey, { u } = {}) {
  const raw = await raFetch('API_GetUserCompletedGames.php', username, apiKey,
    { u: u || username });
  return (Array.isArray(raw) ? raw : []).map(r => ({
    gameId:      r.GameID,
    title:       r.Title,
    imageIcon:   r.ImageIcon,
    consoleId:   r.ConsoleID,
    consoleName: r.ConsoleName,
    maxPossible: r.MaxPossible || 0,
    numAwarded:  r.NumAwarded  || 0,
    pctWon:      parseFloat(r.PctWon) || 0,
    hardcoreMode: r.HardcoreMode === '1' || r.HardcoreMode === 1,
  }));
}

/**
 * API_GetUserProgress — quick progress snapshot for a list of game IDs.
 * Params: { u, i (comma-separated game IDs or array) }
 * Returns map of gameId → progress object.
 */
export async function getUserProgress(username, apiKey, { u, i } = {}) {
  const ids = Array.isArray(i) ? i.join(',') : String(i);
  const raw = await raFetch('API_GetUserProgress.php', username, apiKey,
    { u: u || username, i: ids });
  const result = {};
  for (const [gameId, p] of Object.entries(raw || {})) {
    result[gameId] = {
      numPossibleAchievements: p.NumPossibleAchievements || 0,
      possibleScore:           p.PossibleScore           || 0,
      numAchieved:             p.NumAchieved             || 0,
      scoreAchieved:           p.ScoreAchieved           || 0,
      numAchievedHardcore:     p.NumAchievedHardcore     || 0,
      scoreAchievedHardcore:   p.ScoreAchievedHardcore   || 0,
    };
  }
  return result;
}

/**
 * API_GetUserAwards — all visible awards (game beaten, mastery, site awards).
 * Params: { u }
 */
export async function getUserAwards(username, apiKey, { u } = {}) {
  const raw = await raFetch('API_GetUserAwards.php', username, apiKey, { u: u || username });
  return {
    totalAwardsCount:         raw.TotalAwardsCount         || 0,
    hiddenAwardsCount:        raw.HiddenAwardsCount        || 0,
    masteryAwardsCount:       raw.MasteryAwardsCount       || 0,
    completionAwardsCount:    raw.CompletionAwardsCount    || 0,
    beatenHardcoreAwardsCount: raw.BeatenHardcoreAwardsCount || 0,
    beatenSoftcoreAwardsCount: raw.BeatenSoftcoreAwardsCount || 0,
    eventAwardsCount:         raw.EventAwardsCount         || 0,
    siteAwardsCount:          raw.SiteAwardsCount          || 0,
    visibleUserAwards: (raw.VisibleUserAwards || []).map(a => ({
      awardedAt:    a.AwardedAt,
      awardType:    a.AwardType,
      awardData:    a.AwardData,
      awardDataExtra: a.AwardDataExtra,
      displayOrder: a.DisplayOrder,
      title:        a.Title,
      consoleId:    a.ConsoleID,
      consoleName:  a.ConsoleName,
      flags:        a.Flags,
      imageIcon:    a.ImageIcon,
    })),
  };
}

/**
 * API_GetUserRecentAchievements — achievements unlocked in the last N minutes.
 * Params: { u, m (minutes, default 60) }
 */
export async function getUserRecentAchievements(username, apiKey, { u, m = 60 } = {}) {
  const raw = await raFetch('API_GetUserRecentAchievements.php', username, apiKey,
    { u: u || username, m });
  return (Array.isArray(raw) ? raw : []).map(mapAchievementUnlock);
}

/**
 * API_GetAchievementsEarnedBetween — achievements unlocked in a Unix timestamp range.
 * Params: { u, f (from epoch), t (to epoch) }
 */
export async function getAchievementsEarnedBetween(username, apiKey, { u, f, t } = {}) {
  const raw = await raFetch('API_GetAchievementsEarnedBetween.php', username, apiKey,
    { u: u || username, f, t });
  return (Array.isArray(raw) ? raw : []).map(mapAchievementUnlock);
}

/**
 * API_GetAchievementsEarnedOnDay — achievements unlocked on a specific date.
 * Params: { u, d (YYYY-MM-DD) }
 */
export async function getAchievementsEarnedOnDay(username, apiKey, { u, d } = {}) {
  const raw = await raFetch('API_GetAchievementsEarnedOnDay.php', username, apiKey,
    { u: u || username, d });
  return (Array.isArray(raw) ? raw : []).map(mapAchievementUnlock);
}

/**
 * API_GetUserWantToPlayList — paginated want-to-play list.
 * Returns all pages merged. Params: { u }
 */
export async function getUserWantToPlayList(username, apiKey, { u } = {}) {
  const results = await paginate('API_GetUserWantToPlayList.php', username, apiKey,
    { u: u || username }, 500);
  return results.map(g => ({
    id:                    g.ID,
    title:                 g.Title,
    imageIcon:             g.ImageIcon,
    consoleId:             g.ConsoleID,
    consoleName:           g.ConsoleName,
    pointsTotal:           g.PointsTotal           || 0,
    achievementsPublished: g.AchievementsPublished  || 0,
  }));
}

/**
 * API_GetUserRecentlyPlayedGames — up to 50 recently played games.
 * Params: { u, c (count, max 50, default 10), o (offset) }
 */
export async function getUserRecentlyPlayedGames(username, apiKey, { u, c = 10, o = 0 } = {}) {
  const raw = await raFetch('API_GetUserRecentlyPlayedGames.php', username, apiKey,
    { u: u || username, c, o });
  return (Array.isArray(raw) ? raw : []).map(g => ({
    gameId:                  g.GameID,
    consoleId:               g.ConsoleID,
    consoleName:             g.ConsoleName,
    title:                   g.Title,
    imageIcon:               g.ImageIcon,
    imageTitle:              g.ImageTitle    || null,
    imageIngame:             g.ImageIngame   || null,
    imageBoxArt:             g.ImageBoxArt   || null,
    lastPlayed:              g.LastPlayed,
    achievementsTotal:       g.AchievementsTotal       || 0,
    numPossibleAchievements: g.NumPossibleAchievements || 0,
    possibleScore:           g.PossibleScore            || 0,
    numAchieved:             g.NumAchieved              || 0,
    scoreAchieved:           g.ScoreAchieved            || 0,
    numAchievedHardcore:     g.NumAchievedHardcore      || 0,
    scoreAchievedHardcore:   g.ScoreAchievedHardcore    || 0,
  }));
}

/**
 * API_GetUserClaims — achievement set claims made by a user.
 * Params: { u }
 */
export async function getUserClaims(username, apiKey, { u } = {}) {
  const raw = await raFetch('API_GetUserClaims.php', username, apiKey, { u: u || username });
  return (Array.isArray(raw) ? raw : []).map(mapClaim);
}

/**
 * API_GetUserGameRankAndScore — user's rank and score for a specific game.
 * Params: { u, g (game ID) }
 * Returns null if the user has no progress on that game.
 */
export async function getUserGameRankAndScore(username, apiKey, { u, g } = {}) {
  const raw = await raFetch('API_GetUserGameRankAndScore.php', username, apiKey,
    { u: u || username, g });
  const arr = Array.isArray(raw) ? raw : [];
  if (!arr.length) return null;
  const r = arr[0];
  return {
    user:       r.User,
    ulid:       r.ULID,
    userRank:   r.UserRank,
    totalScore: r.TotalScore,
    lastAward:  r.LastAward,
  };
}

/**
 * API_GetUserSetRequests — games the user has requested an achievement set for.
 * Params: { u, t (0 = active only, 1 = all) }
 */
export async function getUserSetRequests(username, apiKey, { u, t = 0 } = {}) {
  const raw = await raFetch('API_GetUserSetRequests.php', username, apiKey,
    { u: u || username, t });
  return {
    totalRequests: raw.TotalRequests  || 0,
    pointsForNext: raw.PointsForNext  || 0,
    requestedSets: (raw.RequestedSets || []).map(g => ({
      gameId:      g.GameID,
      title:       g.Title,
      consoleId:   g.ConsoleID,
      consoleName: g.ConsoleName,
      imageIcon:   g.ImageIcon,
    })),
  };
}

/**
 * API_GetUsersIFollow — paginated list of users the authenticated user follows.
 * Params: { c (count, max 500, default 100), o (offset) }
 */
export async function getUsersIFollow(username, apiKey, { c = 100, o = 0 } = {}) {
  const data = await withRetry(() => raFetch('API_GetUsersIFollow.php', username, apiKey, { c, o }));
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(u => ({
      user:           u.User,
      ulid:           u.ULID,
      userPic:        u.UserPic        || null,
      points:         u.Points         || 0,
      pointsSoftcore: u.PointsSoftcore || 0,
      isFollowingMe:  u.IsFollowingMe  || false,
    })),
  };
}

/**
 * API_GetUsersFollowingMe — paginated list of users following the authenticated user.
 * Params: { c (count, max 500, default 100), o (offset) }
 */
export async function getUsersFollowingMe(username, apiKey, { c = 100, o = 0 } = {}) {
  const data = await withRetry(() => raFetch('API_GetUsersFollowingMe.php', username, apiKey, { c, o }));
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(u => ({
      user:           u.User,
      ulid:           u.ULID,
      userPic:        u.UserPic        || null,
      points:         u.Points         || 0,
      pointsSoftcore: u.PointsSoftcore || 0,
      amIFollowing:   u.AmIFollowing   || false,
    })),
  };
}

/**
 * API_GetGameInfoAndUserProgress — full game metadata + user unlock state per achievement.
 * Params: { u, g (game ID) }
 */
export async function getGameInfoAndUserProgress(username, apiKey, { u, g } = {}) {
  const raw = await raFetch('API_GetGameInfoAndUserProgress.php', username, apiKey,
    { u: u || username, g });
  if (!raw) return null;

  const achievements = {};
  for (const [id, a] of Object.entries(raw.Achievements || {})) {
    achievements[id] = {
      id:                 a.ID,
      title:              a.Title,
      description:        a.Description         || '',
      points:             a.Points              || 0,
      trueRatio:          a.TrueRatio           || a.Points || 0,
      badgeName:          a.BadgeName,
      type:               a.Type                || null,
      displayOrder:       a.DisplayOrder        || 0,
      numAwarded:         a.NumAwarded          || 0,
      numAwardedHardcore: a.NumAwardedHardcore  || 0,
      dateEarned:         a.DateEarned          || null,
      dateEarnedHardcore: a.DateEarnedHardcore  || null,
    };
  }

  return {
    id:                         raw.ID,
    title:                      raw.Title,
    consoleId:                  raw.ConsoleID,
    consoleName:                raw.ConsoleName,
    forumTopicId:               raw.ForumTopicID              || null,
    imageIcon:                  raw.ImageIcon,
    imageTitle:                 raw.ImageTitle                || null,
    imageIngame:                raw.ImageIngame               || null,
    imageBoxArt:                raw.ImageBoxArt               || null,
    publisher:                  raw.Publisher                 || null,
    developer:                  raw.Developer                 || null,
    genre:                      raw.Genre                     || null,
    released:                   raw.Released                  || null,
    isFinal:                    raw.IsFinal                   || false,
    richPresencePatch:          raw.RichPresencePatch         || null,
    guideUrl:                   raw.GuideURL                  || null,
    parentGameId:               raw.ParentGameID              || null,
    numDistinctPlayers:         raw.NumDistinctPlayers        || 0,
    numDistinctPlayersCasual:   raw.NumDistinctPlayersCasual  || raw.NumDistinctPlayers || 0,
    numDistinctPlayersHardcore: raw.NumDistinctPlayersHardcore || 0,
    numAchievements:            raw.NumAchievements           || 0,
    // User-specific progress
    userTotalPlaytime:          raw.UserTotalPlaytime          || null,
    numAwardedToUser:           raw.NumAwardedToUser           || 0,
    numAwardedToUserHardcore:   raw.NumAwardedToUserHardcore   || 0,
    userCompletion:             raw.UserCompletion             || '0.00%',
    userCompletionHardcore:     raw.UserCompletionHardcore     || '0.00%',
    highestAwardKind:           raw.HighestAwardKind           || null,
    highestAwardDate:           raw.HighestAwardDate           || null,
    achievements,
  };
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── GAME ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetGame — basic game metadata (no achievements, no user data).
 * Params: { i (game ID) }
 */
export async function getGame(username, apiKey, { i } = {}) {
  const raw = await raFetch('API_GetGame.php', username, apiKey, { i });
  return {
    title:                 raw.Title,
    gameTitle:             raw.GameTitle,
    consoleId:             raw.ConsoleID,
    consoleName:           raw.ConsoleName,
    forumTopicId:          raw.ForumTopicID  || null,
    flags:                 raw.Flags,
    gameIcon:              raw.GameIcon,
    imageIcon:             raw.ImageIcon,
    imageTitle:            raw.ImageTitle    || null,
    imageIngame:           raw.ImageIngame   || null,
    imageBoxArt:           raw.ImageBoxArt   || null,
    publisher:             raw.Publisher     || null,
    developer:             raw.Developer     || null,
    genre:                 raw.Genre         || null,
    released:              raw.Released      || null,
    releasedAtGranularity: raw.ReleasedAtGranularity || null,
  };
}

/**
 * API_GetGameExtended — full game metadata including achievement list.
 * Params: { i (game ID), f (3 = official only, 5 = include unofficial) }
 */
export async function getGameExtended(username, apiKey, { i, f = 3 } = {}) {
  const raw = await raFetch('API_GetGameExtended.php', username, apiKey, { i, f });

  const achievements = {};
  for (const [id, a] of Object.entries(raw.Achievements || {})) {
    achievements[id] = {
      id:                 a.ID,
      numAwarded:         a.NumAwarded         || 0,
      numAwardedHardcore: a.NumAwardedHardcore  || 0,
      title:              a.Title,
      description:        a.Description        || '',
      points:             a.Points             || 0,
      trueRatio:          a.TrueRatio          || a.Points || 0,
      author:             a.Author,
      authorUlid:         a.AuthorULID,
      dateModified:       a.DateModified,
      dateCreated:        a.DateCreated,
      badgeName:          a.BadgeName,
      displayOrder:       a.DisplayOrder       || 0,
      type:               a.type               || null,
    };
  }

  return {
    id:                         raw.ID,
    title:                      raw.Title,
    consoleId:                  raw.ConsoleID,
    consoleName:                raw.ConsoleName,
    forumTopicId:               raw.ForumTopicID              || null,
    flags:                      raw.Flags,
    imageIcon:                  raw.ImageIcon,
    imageTitle:                 raw.ImageTitle                || null,
    imageIngame:                raw.ImageIngame               || null,
    imageBoxArt:                raw.ImageBoxArt               || null,
    publisher:                  raw.Publisher                 || null,
    developer:                  raw.Developer                 || null,
    genre:                      raw.Genre                     || null,
    released:                   raw.Released                  || null,
    releasedAtGranularity:      raw.ReleasedAtGranularity     || null,
    isFinal:                    raw.IsFinal                   || false,
    richPresencePatch:          raw.RichPresencePatch         || null,
    guideUrl:                   raw.GuideURL                  || null,
    updated:                    raw.Updated                   || null,
    parentGameId:               raw.ParentGameID              || null,
    numDistinctPlayers:         raw.NumDistinctPlayers        || 0,
    numDistinctPlayersCasual:   raw.NumDistinctPlayersCasual  || 0,
    numDistinctPlayersHardcore: raw.NumDistinctPlayersHardcore || 0,
    numAchievements:            raw.NumAchievements           || 0,
    claims:                     (Array.isArray(raw.Claims) ? raw.Claims : []).map(mapClaim),
    achievements,
  };
}

/**
 * API_GetGameList — games for a console.
 * Params: { i (console ID), f (1 = only games with achievements), h (1 = include hashes),
 *            c (count), o (offset) }
 */
export async function getGameList(username, apiKey, { i, f = 1, h = 0, c = 500, o = 0 } = {}) {
  const raw = await raFetch('API_GetGameList.php', username, apiKey, { i, f, h, c, o });
  return (Array.isArray(raw) ? raw : []).map(g => ({
    title:            g.Title,
    id:               g.ID,
    consoleId:        g.ConsoleID,
    consoleName:      g.ConsoleName,
    imageIcon:        g.ImageIcon,
    numAchievements:  g.NumAchievements  || 0,
    numLeaderboards:  g.NumLeaderboards  || 0,
    points:           g.Points           || 0,
    dateModified:     g.DateModified     || null,
    forumTopicId:     g.ForumTopicID     || null,
    hashes:           g.Hashes           || [],
  }));
}

/**
 * API_GetGameHashes — supported ROM hashes for a game.
 * Params: { i (game ID) }
 */
export async function getGameHashes(username, apiKey, { i } = {}) {
  const raw = await raFetch('API_GetGameHashes.php', username, apiKey, { i });
  return (raw.Results || []).map(h => ({
    md5:      h.MD5,
    name:     h.Name,
    labels:   h.Labels   || [],
    patchUrl: h.PatchUrl || null,
  }));
}

/**
 * API_GetGameLeaderboards — leaderboards for a game.
 * Params: { i (game ID), c (count, max 500, default 100), o (offset) }
 */
export async function getGameLeaderboards(username, apiKey, { i, c = 100, o = 0 } = {}) {
  const data = await raFetch('API_GetGameLeaderboards.php', username, apiKey, { i, c, o });
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(lb => ({
      id:          lb.ID,
      rankAsc:     lb.RankAsc,
      title:       lb.Title,
      description: lb.Description || '',
      format:      lb.Format,
      author:      lb.Author,
      authorUlid:  lb.AuthorULID,
      topEntry:    lb.TopEntry ? {
        user:           lb.TopEntry.User,
        ulid:           lb.TopEntry.ULID,
        score:          lb.TopEntry.Score,
        formattedScore: lb.TopEntry.FormattedScore,
      } : null,
    })),
  };
}

/**
 * API_GetUserGameLeaderboards — leaderboard entries for a user on a specific game.
 * Params: { i (game ID), u, c (max 500, default 200), o (offset) }
 */
export async function getUserGameLeaderboards(username, apiKey, { i, u, c = 200, o = 0 } = {}) {
  const data = await raFetch('API_GetUserGameLeaderboards.php', username, apiKey,
    { i, u: u || username, c, o });
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(lb => ({
      id:          lb.ID,
      rankAsc:     lb.RankAsc,
      title:       lb.Title,
      description: lb.Description || '',
      format:      lb.Format,
      userEntry:   lb.UserEntry ? {
        user:           lb.UserEntry.User,
        ulid:           lb.UserEntry.ULID,
        score:          lb.UserEntry.Score,
        formattedScore: lb.UserEntry.FormattedScore,
        rank:           lb.UserEntry.Rank,
        dateUpdated:    lb.UserEntry.DateUpdated,
      } : null,
    })),
  };
}

/**
 * API_GetGameRankAndScore — top scorers or latest masters for a game.
 * Params: { g (game ID), t (0 = high scores, 1 = latest masters) }
 */
export async function getGameRankAndScore(username, apiKey, { g, t = 0 } = {}) {
  const raw = await raFetch('API_GetGameRankAndScore.php', username, apiKey, { g, t });
  return (Array.isArray(raw) ? raw : []).map(r => ({
    user:             r.User,
    ulid:             r.ULID,
    userPic:          r.UserPic         || null,
    numAchievements:  r.NumAchievements || 0,
    totalScore:       r.TotalScore      || 0,
    lastAward:        r.LastAward,
    rank:             r.Rank,
  }));
}

/**
 * API_GetGameProgression — median completion/mastery times for a game.
 * Params: { i (game ID), h (1 = prefer hardcore) }
 */
export async function getGameProgression(username, apiKey, { i, h = 0 } = {}) {
  const raw = await raFetch('API_GetGameProgression.php', username, apiKey, { i, h });
  return {
    id:                              raw.ID,
    title:                           raw.Title,
    consoleId:                       raw.ConsoleID,
    consoleName:                     raw.ConsoleName,
    imageIcon:                       raw.ImageIcon,
    numDistinctPlayers:              raw.NumDistinctPlayers             || 0,
    medianTimeToBeat:                raw.MedianTimeToBeat               || null,
    medianTimeToBeatHardcore:        raw.MedianTimeToBeatHardcore       || null,
    medianTimeToComplete:            raw.MedianTimeToComplete           || null,
    medianTimeToMaster:              raw.MedianTimeToMaster             || null,
    numAchievements:                 raw.NumAchievements                || 0,
    achievements:                    raw.Achievements                   || [],
  };
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── ACHIEVEMENT ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetAchievementOfTheWeek — current achievement of the week with unlock stats.
 */
export async function getAchievementOfTheWeek(username, apiKey) {
  const raw = await raFetch('API_GetAchievementOfTheWeek.php', username, apiKey, {});
  return {
    achievement: raw.Achievement  || null,
    console:     raw.Console      || null,
    forumTopic:  raw.ForumTopic   || null,
    game:        raw.Game         || null,
    startAt:     raw.StartAt,
    totalPlayers:           raw.TotalPlayers           || 0,
    unlocksCount:           raw.UnlocksCount           || 0,
    unlocksHardcoreCount:   raw.UnlocksHardcoreCount   || 0,
    unlocks: (raw.Unlocks || []).map(u => ({
      user:              u.User,
      ulid:              u.ULID,
      raPoints:          u.RAPoints          || 0,
      raSoftcorePoints:  u.RASoftcorePoints  || 0,
      dateAwarded:       u.DateAwarded,
      hardcoreMode:      u.HardcoreMode === 1 || u.HardcoreMode === '1',
    })),
  };
}

/**
 * API_GetAchievementUnlocks — users who unlocked a specific achievement.
 * Params: { a (achievement ID), c (count, max 500, default 50), o (offset) }
 */
export async function getAchievementUnlocks(username, apiKey, { a, c = 50, o = 0 } = {}) {
  const data = await raFetch('API_GetAchievementUnlocks.php', username, apiKey, { a, c, o });
  const rawAch = data.Achievement || {};
  return {
    achievement: {
      id:           rawAch.ID           || null,
      title:        rawAch.Title        || '',
      description:  rawAch.Description  || '',
      points:       rawAch.Points       || 0,
      trueRatio:    rawAch.TrueRatio    || 0,
      author:       rawAch.Author       || '',
      dateCreated:  rawAch.DateCreated  || null,
      dateModified: rawAch.DateModified || null,
      badgeName:    rawAch.BadgeName    || '',
      displayOrder: rawAch.DisplayOrder || 0,
      gameId:       rawAch.GameID       || null,
      consoleId:    rawAch.ConsoleID    || null,
      type:         rawAch.Type         || null,
    },
    console: data.Console ? { id: data.Console.ID, title: data.Console.Title } : null,
    game:    data.Game    ? { id: data.Game.ID, title: data.Game.Title || '', consoleId: data.Game.ConsoleID } : null,
    unlocksCount:         data.UnlocksCount         || 0,
    unlocksHardcoreCount: data.UnlocksHardcoreCount || 0,
    totalPlayers:         data.TotalPlayers         || 0,
    unlocks: (data.Unlocks || []).map(u => ({
      user:             u.User,
      ulid:             u.ULID,
      userPic:          u.UserPic          || null,
      raPoints:         u.RAPoints         || 0,
      raSoftcorePoints: u.RASoftcorePoints || 0,
      dateAwarded:      u.DateAwarded,
      hardcoreMode:     u.HardcoreMode === 1 || u.HardcoreMode === '1',
    })),
  };
}

/**
 * API_GetAchievementCount — list of achievement IDs for a game.
 * Params: { i (game ID) }
 */
export async function getAchievementCount(username, apiKey, { i } = {}) {
  const raw = await raFetch('API_GetAchievementCount.php', username, apiKey, { i });
  return {
    gameId:         raw.GameID,
    achievementIds: raw.AchievementIDs || [],
  };
}

/**
 * API_GetAchievementDistribution — distribution of how many achievements players have earned.
 * Params: { i (game ID), h (1 = hardcore), f (3 = official, 5 = unofficial) }
 * Returns map of achievementCount → playerCount.
 */
export async function getAchievementDistribution(username, apiKey, { i, h = 0, f = 3 } = {}) {
  const raw = await raFetch('API_GetAchievementDistribution.php', username, apiKey, { i, h, f });
  return raw || {};
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── SYSTEM ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetConsoleIDs — all consoles/systems.
 * Params: { a (1 = active only), g (1 = gaming systems only) }
 */
export async function getConsoleIds(username, apiKey, { a = 0, g = 0 } = {}) {
  const raw = await raFetch('API_GetConsoleIDs.php', username, apiKey, { a, g });
  return (Array.isArray(raw) ? raw : []).map(c => ({
    id:          c.ID,
    name:        c.Name,
    iconUrl:     c.IconURL     || null,
    active:      c.Active      || false,
    isGameSystem: c.IsGameSystem || false,
  }));
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── LEADERBOARD ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetLeaderboardEntries — entries for a leaderboard.
 * Params: { i (leaderboard ID), c (count, max 500, default 100), o (offset) }
 */
export async function getLeaderboardEntries(username, apiKey, { i, c = 100, o = 0 } = {}) {
  const data = await raFetch('API_GetLeaderboardEntries.php', username, apiKey, { i, c, o });
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(r => ({
      rank:           r.Rank,
      user:           r.User,
      ulid:           r.ULID,
      userPic:        r.UserPic        || null,
      score:          r.Score,
      formattedScore: r.FormattedScore,
      dateSubmitted:  r.DateSubmitted,
    })),
  };
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── FEED ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetRecentGameAwards — recent beaten/mastered game awards across all users.
 * Params: { d (start date YYYY-MM-DD), o (offset), c (count, max 100, default 25),
 *            k (comma-separated award kinds: beaten-softcore, beaten-hardcore, completed, mastered) }
 */
export async function getRecentGameAwards(username, apiKey,
  { d, o = 0, c = 25, k } = {}) {
  const params = { o, c };
  if (d) params.d = d;
  if (k) params.k = k;
  const data = await raFetch('API_GetRecentGameAwards.php', username, apiKey, params);
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(r => ({
      user:        r.User,
      ulid:        r.ULID,
      awardKind:   r.AwardKind,
      awardDate:   r.AwardDate,
      gameId:      r.GameID,
      gameTitle:   r.GameTitle,
      consoleId:   r.ConsoleID,
      consoleName: r.ConsoleName,
    })),
  };
}

/**
 * API_GetActiveClaims — currently active achievement set claims.
 */
export async function getActiveClaims(username, apiKey) {
  const raw = await raFetch('API_GetActiveClaims.php', username, apiKey, {});
  return (Array.isArray(raw) ? raw : []).map(mapClaim);
}

/**
 * API_GetClaims — inactive (completed/dropped/expired) claims.
 * Params: { k (1 = completed, 2 = dropped, 3 = expired) }
 */
export async function getClaims(username, apiKey, { k = 1 } = {}) {
  const raw = await raFetch('API_GetClaims.php', username, apiKey, { k });
  return (Array.isArray(raw) ? raw : []).map(mapClaim);
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── COMMENT ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetComments — comments on a game, achievement, or user wall.
 * Params: { i (target ID), t (1 = game, 2 = achievement, 3 = user),
 *            c (count, max 500, default 100), o (offset),
 *            sort ('submitted' or '-submitted') }
 */
export async function getComments(username, apiKey,
  { i, t, c = 100, o = 0, sort = '-submitted' } = {}) {
  const data = await raFetch('API_GetComments.php', username, apiKey,
    { i, t, c, o, sort });
  return {
    count:   data.Count  || 0,
    total:   data.Total  || 0,
    results: (data.Results || []).map(r => ({
      user:        r.User,
      ulid:        r.ULID,
      userPic:     r.UserPic     || null,
      submitted:   r.Submitted,
      commentText: r.CommentText,
    })),
  };
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── TICKET ENDPOINTS
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * API_GetTicketData — ticket info. Mode is selected by which param is passed:
 *   { ticketId }        → single ticket by ID
 *   { achievementId }   → ticket stats for an achievement
 *   { gameId }          → ticket stats for a game
 *   { username }        → developer ticket stats
 *   { c, o }            → most recent tickets (paginated)
 *   { f: 1, c, o }      → most ticketed games
 */
export async function getTicketData(username, apiKey,
  { ticketId, achievementId, gameId, targetUser, f, c = 10, o = 0 } = {}) {
  const params = {};
  if (ticketId    != null) params.i = ticketId;
  if (achievementId != null) params.a = achievementId;
  if (gameId      != null) params.g = gameId;
  if (targetUser  != null) params.u = targetUser;
  if (f           != null) params.f = f;
  params.c = c;
  params.o = o;
  return raFetch('API_GetTicketData.php', username, apiKey, params);
}

// ── ─────────────────────────────────────────────────────────────────────────
// ── APP-LEVEL COMPOSITES  (used by app.js — include caching)
// ── ─────────────────────────────────────────────────────────────────────────

/**
 * Fetches all data needed for the initial profile render in one go.
 * Fires 5 parallel requests, then computes points7Days / points30Days from chunk 0.
 * Cached for 5 minutes under key ra_profile_{username}.
 *
 * Returns { profileData, firstChunkAchievements }
 * where profileData is the raw merged object consumed by transformData().
 */
export async function fetchProfile(username, apiKey, targetUser) {
  const u = targetUser || username;
  const cacheKey = `ra_profile_${u}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const now       = new Date().toISOString();
  const nowTs     = Math.floor(Date.now() / 1000);
  const chunk0From = nowTs - 182 * 24 * 60 * 60;

  const [profileRaw, summaryRaw, completionResults, awardsRaw, achRaw] = await Promise.all([
    raFetch('API_GetUserProfile.php',              username, apiKey, { u }),
    raFetch('API_GetUserSummary.php',              username, apiKey, { u, g: 20, a: 5 }),
    paginate('API_GetUserCompletionProgress.php',  username, apiKey, { u }),
    raFetch('API_GetUserAwards.php',               username, apiKey, { u }),
    withRetry(() => raFetch('API_GetAchievementsEarnedBetween.php', username, apiKey,
      { u, f: chunk0From, t: nowTs })),
  ]);

  const firstChunkAchievements = (Array.isArray(achRaw) ? achRaw : []).map(mapAchievementUnlock);

  // Build recentlyPlayed from summary
  const recentlyPlayed = (summaryRaw.RecentlyPlayed || []).map(g => ({
    gameId:      g.GameID,
    title:       g.Title,
    consoleName: g.ConsoleName,
    lastPlayed:  g.LastPlayed,
    imageIcon:   g.ImageIcon,
    imageIngame: g.ImageIngame  || null,
    imageTitle:  g.ImageTitle   || null,
    numAchieved: g.NumAchieved  || 0,
    numPossibleAchievements: g.AchievementsTotal || 0,
  }));

  // Most recent achievement
  let mostRecentAchievement = null;
  let latestDate = null;
  for (const [gameIdStr, gameAchs] of Object.entries(summaryRaw.RecentAchievements || {})) {
    const gameId = parseInt(gameIdStr, 10);
    const gameInfo = recentlyPlayed.find(g => g.gameId === gameId);
    for (const ach of Object.values(gameAchs)) {
      if (!latestDate || (ach.DateAwarded && ach.DateAwarded > latestDate)) {
        latestDate = ach.DateAwarded;
        mostRecentAchievement = {
          achievementId: ach.ID,
          title:         ach.Title,
          description:   ach.Description  || '',
          points:        ach.Points        || 0,
          trueRatio:     ach.TrueRatio     || 0,
          badgeName:     ach.BadgeName,
          hardcoreMode:  ach.HardcoreAchieved === 1 || ach.HardcoreAchieved === '1',
          gameId,
          gameTitle:     ach.GameTitle || gameInfo?.title || '',
          gameIcon:      gameInfo?.imageIcon || null,
          consoleName:   gameInfo?.consoleName || '',
          date:          ach.DateAwarded,
        };
      }
    }
  }

  // Most recent game
  const lastGame = summaryRaw.LastGame || null;
  const mostRecentGame = lastGame ? {
    gameId:      lastGame.ID,
    title:       lastGame.Title,
    consoleName: lastGame.ConsoleName,
    lastPlayed:  lastGame.LastPlayed || recentlyPlayed[0]?.lastPlayed || null,
    imageIcon:   lastGame.ImageIcon,
  } : recentlyPlayed[0] ? {
    gameId:      recentlyPlayed[0].gameId,
    title:       recentlyPlayed[0].title,
    consoleName: recentlyPlayed[0].consoleName,
    lastPlayed:  recentlyPlayed[0].lastPlayed,
    imageIcon:   recentlyPlayed[0].imageIcon,
  } : null;

  const profileData = {
    metadata: { extractionTimestamp: now },
    coreProfile: {
      user:                profileRaw.User,
      userPic:             profileRaw.UserPic,
      memberSince:         profileRaw.MemberSince,
      richPresenceMsg:     profileRaw.RichPresenceMsg     || '',
      totalPoints:         profileRaw.TotalPoints         || 0,
      totalSoftcorePoints: profileRaw.TotalSoftcorePoints || 0,
      totalTruePoints:     profileRaw.TotalTruePoints     || 0,
      motto:               profileRaw.Motto               || '',
    },
    userSummary: {
      rank:         summaryRaw.Rank,
      totalRanked:  summaryRaw.TotalRanked,
      softcoreRank: summaryRaw.SoftcoreRank || null,
      status:       summaryRaw.Status,
      lastActivity: null,
    },
    gameAwardsAndProgress: {
      total:   completionResults.length,
      results: completionResults.map(r => ({
        gameId:                r.GameID,
        title:                 r.Title,
        consoleName:           r.ConsoleName,
        imageIcon:             r.ImageIcon,
        numAwarded:            r.NumAwarded            || 0,
        numAwardedHardcore:    r.NumAwardedHardcore     || 0,
        maxPossible:           r.MaxPossible            || 0,
        highestAwardKind:      r.HighestAwardKind       || null,
        highestAwardDate:      r.HighestAwardDate       || null,
        mostRecentAwardedDate: r.MostRecentAwardedDate  || null,
      })),
    },
    pageAwards: {
      visibleUserAwards: (awardsRaw.VisibleUserAwards || []).map(a => ({
        awardType:   a.AwardType,
        imageIcon:   a.ImageIcon,
        awardData:   a.AwardData,
        title:       a.Title,
        consoleName: a.ConsoleName,
        awardedAt:   a.AwardedAt,
      })),
    },
    recentlyPlayedGames: recentlyPlayed,
    mostRecentGame,
    mostRecentAchievement,
    points7Days:  0,
    points30Days: 0,
  };

  // Compute points7Days / points30Days from chunk 0
  const nowMs        = Date.now();
  const sevenDaysMs  = 7  * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  for (const ach of firstChunkAchievements) {
    const diff = nowMs - new Date(ach.date).getTime();
    if (diff <= thirtyDaysMs) {
      profileData.points30Days += ach.points;
      if (diff <= sevenDaysMs) profileData.points7Days += ach.points;
    }
  }

  const result = { profileData, firstChunkAchievements };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches a 6-month achievement chunk by index (0 = most recent, 1 = 6–12 months ago).
 * Cached for 5 minutes under key ra_chunk_{username}_{chunkIndex}.
 */
export async function fetchAchievementsChunk(username, apiKey, chunkIndex) {
  const cacheKey = `ra_chunk_${username}_${chunkIndex}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const nowTs     = Math.floor(Date.now() / 1000);
  const chunkSize = 182 * 24 * 60 * 60;
  const toTs      = nowTs - chunkIndex * chunkSize;
  const fromTs    = toTs - chunkSize;

  const raw = await withRetry(() => raFetch('API_GetAchievementsEarnedBetween.php', username, apiKey,
    { u: username, f: fromTs, t: toTs }));
  const result = (Array.isArray(raw) ? raw : []).map(mapAchievementUnlock);
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches the user's want-to-play list (all pages, 100/page).
 * Cached for 5 minutes under key ra_backlog_{username}.
 */
export async function fetchBacklog(username, apiKey) {
  const cacheKey = `ra_backlog_${username}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const results = await paginate('API_GetUserWantToPlayList.php', username, apiKey, {}, 500);
  const result = {
    total: results.length,
    results: results.map(g => ({
      id:                    g.ID,
      title:                 g.Title,
      consoleName:           g.ConsoleName,
      imageIcon:             g.ImageIcon,
      pointsTotal:           g.PointsTotal           || 0,
      achievementsPublished: g.AchievementsPublished  || 0,
    })),
  };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches all game systems, filtered and sorted alphabetically.
 * Cached under key ra_consoles.
 */
export async function fetchConsoles(username, apiKey) {
  const cacheKey = 'ra_consoles';
  const cached = lcacheGet(cacheKey);
  if (cached) return cached;

  const data = await getConsoleIds(username, apiKey);
  const result = data
    .filter(c => c.isGameSystem && c.active)
    .sort((a, b) => a.name.localeCompare(b.name));
  lcacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches the full game list for a console, sorted alphabetically.
 * Cached under key ra_consolegames_{consoleId}.
 */
export async function fetchConsoleGames(username, apiKey, consoleId) {
  const cacheKey = `ra_consolegames_${consoleId}`;
  const cached = lcacheGet(cacheKey);
  if (cached) return cached;

  // API_GetGameList returns a plain array (no Results/Total wrapper), so paginate manually.
  const PAGE = 500;
  const all = [];
  let offset = 0;
  while (true) {
    const page = await getGameList(username, apiKey, { i: consoleId, f: 0, c: PAGE, o: offset });
    all.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
    await sleep(1000);
  }

  const hasTilde = t => /~[^~]+~/.test(t);
  const result = all
    .filter(g => !g.title.includes('~z~') && !g.title.includes('~Z~'))
    .sort((a, b) => {
      const aTagged = hasTilde(a.title) ? 1 : 0;
      const bTagged = hasTilde(b.title) ? 1 : 0;
      if (aTagged !== bTagged) return aTagged - bTagged;
      return a.title.localeCompare(b.title);
    });
  lcacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches detailed game metadata + per-achievement user progress for a single game.
 * Includes UserTotalPlaytime (seconds). Cached for 5 minutes under ra_game_{username}_{gameId}.
 */
export async function fetchGameDetails(username, apiKey, gameId) {
  const cacheKey = `ra_game_${username}_${gameId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const raw = await raFetch('API_GetGameInfoAndUserProgress.php', username, apiKey,
    { u: username, g: gameId });
  if (!raw) return null;

  const achievements = {};
  for (const [id, a] of Object.entries(raw.Achievements || {})) {
    achievements[id] = {
      id:                 a.ID,
      title:              a.Title,
      description:        a.Description         || '',
      points:             a.Points              || 0,
      trueRatio:          a.TrueRatio           || a.Points || 0,
      badgeName:          a.BadgeName,
      type:               a.Type                || null,
      displayOrder:       a.DisplayOrder        || 0,
      numAwarded:         a.NumAwarded          || 0,
      numAwardedHardcore: a.NumAwardedHardcore  || 0,
      dateEarned:         a.DateEarned          || null,
      dateEarnedHardcore: a.DateEarnedHardcore  || null,
    };
  }

  const result = {
    userTotalPlaytime:          raw.UserTotalPlaytime          || null,
    numAwardedToUser:           raw.NumAwardedToUser           || 0,
    numAwardedToUserHardcore:   raw.NumAwardedToUserHardcore   || 0,
    highestAwardKind:           raw.HighestAwardKind           || null,
    highestAwardDate:           raw.HighestAwardDate           || null,
    imageIngame:                raw.ImageIngame                || null,
    imageTitle:                 raw.ImageTitle                 || null,
    parentGameId:               raw.ParentGameID               || null,
    numDistinctPlayersCasual:   raw.NumDistinctPlayersCasual   || raw.NumDistinctPlayers || 0,
    numDistinctPlayersHardcore: raw.NumDistinctPlayersHardcore || 0,
    genre:                      raw.Genre                      || null,
    developer:                  raw.Developer                  || null,
    released:                   raw.Released                   || null,
    achievements,
  };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches both following and followers lists.
 * Cache-first: returns localStorage cache if available (1h TTL); fetches from API otherwise.
 */
export async function fetchSocial(username, apiKey) {
  const cacheKey = `ra_social_${username}`;
  const cached = lcacheGet(cacheKey, 60 * 60 * 1000);
  if (cached) return cached;

  const following = await getUsersIFollow(username, apiKey);
  await sleep(500);
  const followers = await getUsersFollowingMe(username, apiKey);
  const result = { following, followers };
  lcacheSet(cacheKey, result);
  return result;
}

/**
 * Validates credentials with a minimal API call.
 * Throws 'AUTH_ERROR' if invalid.
 */
export async function validateCredentials(username, apiKey) {
  const data = await raFetch('API_GetUserProfile.php', username, apiKey, { u: username });
  if (!data?.User) throw new Error('AUTH_ERROR');
  return data;
}
