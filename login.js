import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { validateCredentials, getCredentials, clearCredentials } from './profile/utils/ra-api.js';

function LoginPage() {
  const [username, setUsername]     = useState('');
  const [apiKey, setApiKey]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [checking, setChecking]     = useState(true);
  const [error, setError]           = useState('');
  const [showKey, setShowKey]       = useState(false);

  // Redirect immediately if already authenticated
  useEffect(() => {
    const creds = getCredentials();
    if (creds?.username && creds?.apiKey) {
      window.location.replace('./profile/');
    } else {
      setChecking(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = username.trim();
    const k = apiKey.trim();
    if (!u || !k) { setError('Please enter both your username and API key.'); return; }

    setLoading(true);
    setError('');

    try {
      await validateCredentials(u, k);
      localStorage.setItem('raCredentials', JSON.stringify({ username: u, apiKey: k }));
      window.location.replace('./profile/');
    } catch (err) {
      if (err.message === 'AUTH_ERROR') {
        setError('Invalid username or API key. Please check your credentials and try again.');
      } else {
        setError('Could not connect to RetroAchievements. Check your connection and try again.');
      }
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#171a21] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2a475e] border-t-[#66c0f4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col items-center justify-center px-4 py-12">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="https://static.retroachievements.org/assets/images/favicon.webp"
            onError={e => { e.target.onerror = null; e.target.src = "https://avatars.githubusercontent.com/u/49842581?s=64&v=4"; }}
            alt="RetroAchievements"
            className="w-12 h-12 rounded-[2px]"
          />
          <h1 className="text-xl text-white font-medium tracking-wide">Cheevo Tracker</h1>
          <p className="text-[11px] text-[#546270] uppercase tracking-[0.1em]">RetroAchievements Profile</p>
        </div>

        {/* Card */}
        <div className="bg-[#1b2838] border border-[#2a475e] rounded-[3px] shadow-xl p-6 flex flex-col gap-5">

          <div className="flex items-center gap-2 border-b border-[#2a475e] pb-4">
            <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
            <span className="text-[13px] text-white tracking-wide uppercase font-medium">Connect Account</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#8f98a0] uppercase tracking-[0.1em] font-semibold">
                RA Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                disabled={loading}
                className="bg-[#101214] border border-[#323f4c] hover:border-[#546270] focus:border-[#66c0f4] outline-none text-[12px] text-[#c6d4df] placeholder-[#546270] px-3 py-2 rounded-[2px] transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-[#8f98a0] uppercase tracking-[0.1em] font-semibold">
                  API Key
                </label>
                <a
                  href="https://retroachievements.org/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] text-[#546270] hover:text-[#66c0f4] transition-colors uppercase tracking-wider"
                >
                  Get your key ↗
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full bg-[#101214] border border-[#323f4c] hover:border-[#546270] focus:border-[#66c0f4] outline-none text-[12px] text-[#c6d4df] placeholder-[#546270] px-3 py-2 pr-10 rounded-[2px] transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#546270] hover:text-[#8f98a0] transition-colors text-[10px] select-none"
                  tabIndex={-1}
                >
                  {showKey ? 'hide' : 'show'}
                </button>
              </div>
              {/* How-to hint */}
              <div className="bg-[#131a22] border border-[#2a475e] rounded-[2px] px-3 py-2.5 flex flex-col gap-1.5 mt-0.5">
                <p className="text-[10px] text-[#8f98a0] font-semibold uppercase tracking-[0.08em]">How to get your API key</p>
                <ol className="flex flex-col gap-1">
                  {[
                    <>Log in at <a href="https://retroachievements.org" target="_blank" rel="noreferrer" className="text-[#66c0f4] hover:text-[#c6d4df] transition-colors">retroachievements.org</a></>,
                    <>Go to <a href="https://retroachievements.org/settings" target="_blank" rel="noreferrer" className="text-[#66c0f4] hover:text-[#c6d4df] transition-colors">Settings</a> → <span className="text-[#c6d4df]">Keys</span> section</>,
                    <>Copy the value under <span className="text-[#c6d4df]">Web API Key</span></>,
                  ].map((step, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-[10px] text-[#546270]">
                      <span className="text-[#e5b143] font-bold shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.3)] rounded-[2px] px-3 py-2">
                <span className="text-[#ff6b6b] text-[16px] leading-none shrink-0 mt-[1px]">!</span>
                <p className="text-[11px] text-[#ff6b6b] leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !apiKey.trim()}
              className="flex items-center justify-center gap-2 bg-[#e5b143] hover:bg-[#c9a03d] disabled:bg-[#2a3a4c] disabled:text-[#546270] text-[#101214] disabled:cursor-not-allowed font-bold text-[11px] uppercase tracking-[0.1em] px-4 py-2.5 rounded-[2px] transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#546270] border-t-[#c6d4df] rounded-full animate-spin" />
                  Connecting…
                </>
              ) : (
                'Connect'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#546270] mt-5 leading-relaxed">
          Your API key is stored only in your browser's local storage<br/>and sent directly to RetroAchievements.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<LoginPage />);
