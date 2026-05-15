#!/usr/bin/env node
/**
 * Automated screenshot capture for README.
 *
 * Setup (one time):
 *   cd scripts && npm install puppeteer
 *
 * Run:
 *   RA_USERNAME=you RA_API_KEY=yourkey RA_GAME_ID=1234 node scripts/screenshot.js
 *
 * Options (env vars):
 *   APP_URL      Base URL of the running app  (default: http://localhost:3000)
 *   RA_USERNAME  Your RetroAchievements username
 *   RA_API_KEY   Your RetroAchievements API key
 *   RA_GAME_ID   ID of a game you have progress on (for the game page screenshot)
 *   RA_SEARCH    Search query for the search page screenshot (default: mario)
 *
 * The app must already be running at APP_URL before you run this script.
 * Quickest way:  npx serve . -l 3000  (run from the project root)
 *
 * Output: docs/screenshots/{hero,profile,game,friends,search}.png
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────

const BASE    = (process.env.APP_URL     || 'http://localhost:3000').replace(/\/$/, '');
const USER    = process.env.RA_USERNAME  || '';
const KEY     = process.env.RA_API_KEY   || '';
const GAME_ID = process.env.RA_GAME_ID   || '';
const SEARCH  = process.env.RA_SEARCH    || 'mario';

if (!USER || !KEY) {
  console.error('\nError: set RA_USERNAME and RA_API_KEY before running.\n');
  console.error('  RA_USERNAME=you RA_API_KEY=yourkey RA_GAME_ID=1234 node scripts/screenshot.js\n');
  process.exit(1);
}

if (!GAME_ID) {
  console.warn('\nWarning: RA_GAME_ID not set — skipping game page screenshot.\n');
}

const OUT = path.resolve(__dirname, '../docs/screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── Viewports ─────────────────────────────────────────────────────────────────

const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 2 };
const HERO    = { width: 1440, height: 900, deviceScaleFactor: 2 };
const MOBILE  = { width: 390,  height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function newPage(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  // Inject credentials into localStorage before any page script runs
  await page.evaluateOnNewDocument((u, k) => {
    localStorage.setItem('raCredentials', JSON.stringify({ username: u, apiKey: k }));
  }, USER, KEY);

  // Suppress console noise
  page.on('console', () => {});
  page.on('pageerror', () => {});

  return page;
}

async function load(page, url, { waitFor, extraWaitMs = 2500 } = {}) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

  if (waitFor) {
    try { await page.waitForSelector(waitFor, { timeout: 10000 }); } catch (_) {}
  }

  // Let animations and lazy-loaded images settle
  await wait(extraWaitMs);
}

async function hideMobileNav(page) {
  // Hide the fixed mobile nav bar so it doesn't obscure content
  await page.evaluate(() => {
    const nav = document.getElementById('mobile-nav');
    if (nav) nav.style.display = 'none';
  });
}

async function shoot(page, filename) {
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ✓  ${filename}`);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

// ── Shots ─────────────────────────────────────────────────────────────────────

async function shotHero(browser) {
  console.log('\n→ Hero (profile, desktop wide)');
  const page = await newPage(browser, HERO);
  await load(page, `${BASE}/profile/?tab=recent`, {
    waitFor: '.heatmap-cell, [class*="heatmap"]',
    extraWaitMs: 3500,
  });
  await hideMobileNav(page);
  await shoot(page, 'hero.png');
  await page.close();
}

async function shotProfile(browser) {
  console.log('\n→ Profile (desktop)');
  const page = await newPage(browser, DESKTOP);
  await load(page, `${BASE}/profile/?tab=recent`, { extraWaitMs: 3500 });
  await hideMobileNav(page);
  await shoot(page, 'profile.png');
  await page.close();
}

async function shotGame(browser) {
  if (!GAME_ID) return;
  console.log('\n→ Game page (desktop)');
  const page = await newPage(browser, DESKTOP);
  await load(page, `${BASE}/game/?id=${GAME_ID}`, { extraWaitMs: 4000 });
  await hideMobileNav(page);
  await shoot(page, 'game.png');
  await page.close();
}

async function shotFriends(browser) {
  console.log('\n→ Friends feed (mobile)');
  const page = await newPage(browser, MOBILE);
  await load(page, `${BASE}/profile/?tab=activity&view=friends`, {
    extraWaitMs: 5000, // friends feed fetches multiple users
  });
  await hideMobileNav(page);
  await shoot(page, 'friends.png');
  await page.close();
}

async function shotSearch(browser) {
  console.log('\n→ Search page (desktop)');
  const page = await newPage(browser, DESKTOP);
  await load(page, `${BASE}/search/`, { extraWaitMs: 1500 });

  // If the index exists, type a query so results are visible
  const hasData = await page.evaluate(() => !!localStorage.getItem('ra_allgames'));
  if (hasData) {
    await page.focus('input[type="text"]');
    await page.type('input[type="text"]', SEARCH, { delay: 60 });
    await wait(800);
  }

  await hideMobileNav(page);
  await shoot(page, 'search.png');
  await page.close();
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nCheevo Tracker — screenshot capture`);
  console.log(`App:    ${BASE}`);
  console.log(`User:   ${USER}`);
  console.log(`Game:   ${GAME_ID || '(skipped)'}`);
  console.log(`Search: "${SEARCH}"`);
  console.log(`Output: ${OUT}\n`);

  // Quick reachability check
  try {
    const http = require('http');
    await new Promise((resolve, reject) => {
      http.get(BASE, res => { res.resume(); resolve(); }).on('error', reject);
    });
  } catch {
    console.error(`\nError: cannot reach ${BASE}`);
    console.error('Start the app first:  npx serve . -l 3000\n');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    await shotHero(browser);
    await shotProfile(browser);
    await shotGame(browser);
    await shotFriends(browser);
    await shotSearch(browser);

    console.log(`\nDone — ${fs.readdirSync(OUT).length} files in docs/screenshots/\n`);
  } finally {
    await browser.close();
  }
})();
