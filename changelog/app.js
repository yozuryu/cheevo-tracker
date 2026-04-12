import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, GitCommit } from 'lucide-react';
import { Topbar, Footer } from '../assets/ui.js';

// ── Parser ─────────────────────────────────────────────────────────────────────
// Parses the changelog markdown into: [{ date, sections: [{ title, entries[] }] }]

const parseChangelog = (md) => {
    const releases = [];
    let current = null;
    let currentSection = null;

    for (const raw of md.split('\n')) {
        const line = raw.trim();
        if (!line || line === '---') continue;

        if (line.startsWith('## ')) {
            currentSection = null;
            current = { date: line.slice(3).trim(), summary: null, sections: [] };
            releases.push(current);
        } else if (line.startsWith('### ') && current) {
            currentSection = { title: line.slice(4).trim(), entries: [] };
            current.sections.push(currentSection);
        } else if (line.startsWith('- ') && currentSection) {
            currentSection.entries.push(line.slice(2).trim());
        } else if (current && !currentSection && !line.startsWith('#')) {
            current.summary = line;
        }
    }

    return releases;
};

// Inline code: `foo` → <code>
const renderText = (text) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`')
            ? <code key={i} className="text-[#57cbde] bg-[#101214] border border-[#2a475e] px-1 py-px rounded-[2px] text-[10px] font-mono">{part.slice(1, -1)}</code>
            : part
    );
};

// ── Section order + colors ─────────────────────────────────────────────────────

const SECTION_ORDER = [
    'Auth',
    'RetroAchievements',
    'Structure',
];

const sortSections = (sections) => {
    const idx = (title) => {
        const i = SECTION_ORDER.indexOf(title);
        return i === -1 ? SECTION_ORDER.length : i;
    };
    return [...sections].sort((a, b) => idx(a.title) - idx(b.title));
};

const SECTION_COLORS = {
    'Auth':              '#57cbde',
    'RetroAchievements': '#e5b143',
    'Structure':         '#8f98a0',
};

const sectionColor = (title) =>
    SECTION_COLORS[title] ?? '#8f98a0';

// ── Components ────────────────────────────────────────────────────────────────

const Entry = ({ text }) => (
    <li className="flex items-start gap-2 text-[11px] text-[#8f98a0] leading-relaxed py-[3px]">
        <span className="mt-[5px] w-[4px] h-[4px] rounded-full bg-[#2a475e] shrink-0" />
        <span>{renderText(text)}</span>
    </li>
);

const Section = ({ title, entries }) => {
    const color = sectionColor(title);
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-[3px] h-[12px] rounded-[1px] shrink-0" style={{ background: color }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
                    {title}
                </span>
            </div>
            <ul className="ml-3 border-l border-[#1e2d3a] pl-3 flex flex-col">
                {entries.map((e, i) => <Entry key={i} text={e} />)}
            </ul>
        </div>
    );
};

const Release = ({ date, summary, sections, defaultOpen }) => {
    const [open, setOpen] = useState(defaultOpen);
    const totalEntries = sections.reduce((s, sec) => s + sec.entries.length, 0);

    // Handle "vYYYY.MM.DD — Label" or plain version strings
    const [rawVersion, ...labelParts] = date.split('—');
    const label = labelParts.join('—').trim();
    const formatted = rawVersion.trim();

    return (
        <div className="mb-3">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 group outline-none"
            >
                <div className="w-2.5 h-2.5 rounded-full border-2 border-[#66c0f4] bg-[#171a21] shrink-0 group-hover:bg-[#66c0f4] transition-colors" />
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-[13px] font-semibold text-[#c6d4df] group-hover:text-white transition-colors leading-snug">
                        {formatted}
                    </span>
                    {label && <span className="text-[10px] text-[#546270] font-normal leading-snug truncate max-w-full">{label}</span>}
                </div>
                <div className="flex-1 h-px bg-[#1e2d3a]" />
                <span className="text-[9px] text-[#546270] shrink-0">
                    {totalEntries} change{totalEntries !== 1 ? 's' : ''}
                </span>
                <ChevronDown
                    size={12}
                    className={`text-[#546270] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="ml-[18px] border-l-2 border-[#1e2d3a] pl-4 pt-3 mt-2">
                    {summary && (
                        <p className="text-[11px] text-[#546270] italic mb-4">{renderText(summary)}</p>
                    )}
                    {sortSections(sections).map((sec, i) => <Section key={i} title={sec.title} entries={sec.entries} />)}
                </div>
            )}
        </div>
    );
};

// ── App ───────────────────────────────────────────────────────────────────────

const App = () => {
    const [releases, setReleases] = useState(null);

    useEffect(() => {
        fetch('../changelog.md')
            .then(r => r.text())
            .then(md => setReleases(parseChangelog(md)))
            .catch(() => setReleases([]));
    }, []);

    return (
        <div className="bg-[#171a21] text-[#c6d4df] min-h-screen flex flex-col font-sans selection:bg-[#66c0f4] selection:text-[#171a21]">

            <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: 'Changelog' }]} />

            {/* Header */}
            <header className="bg-[#1b2838] border-b border-[#2a475e] px-4 md:px-8 pt-8 pb-5 md:pt-5 shadow-md">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        <span className="w-[3px] h-6 bg-[#66c0f4] rounded-[1px] shrink-0" />
                        <h1 className="text-2xl md:text-[26px] text-white font-medium tracking-wide leading-none flex items-center gap-3">
                            <GitCommit size={22} className="text-[#66c0f4]" /> Changelog
                        </h1>
                        {releases && (
                            <span className="ml-2 text-[9px] font-semibold uppercase tracking-[0.07em] px-2 py-[3px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#546270]">
                                <span className="text-[#c6d4df]">{releases.length}</span> releases
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
                {releases === null ? (
                    <div className="flex flex-col gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="shimmer w-2.5 h-2.5 rounded-full shrink-0" />
                                <div className="shimmer h-3 w-28 rounded" />
                                <div className="flex-1 h-px bg-[#1e2d3a]" />
                                <div className="shimmer h-2.5 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                ) : releases.length === 0 ? (
                    <div className="text-center py-16 text-[#546270] text-[11px]">Could not load changelog.</div>
                ) : (
                    <div className="flex flex-col">
                        {releases.map((r, i) => (
                            <Release key={r.date} date={r.date} summary={r.summary} sections={r.sections} defaultOpen={i === 0} />
                        ))}
                    </div>
                )}
            </main>

            <Footer label="Cheevo Tracker · Changelog" />

        </div>
    );
};

createRoot(document.getElementById('root')).render(<App />);
