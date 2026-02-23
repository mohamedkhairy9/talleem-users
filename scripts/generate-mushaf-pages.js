#!/usr/bin/env node
/**
 * One-time script to (re)generate the static asset public/data/mushaf_pages.json.
 * Each mushaf page (1–604) gets start_verse_key and end_verse_key; the app uses
 * this file only (no external API at runtime). Run locally when needed:
 *   node scripts/generate-mushaf-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'public', 'data', 'mushaf_pages.json');
const BASE = 'https://api.quran.com/api/v4/verses/by_page';

async function fetchPageVerses(pageNum) {
    const res = await fetch(`${BASE}/${pageNum}?per_page=50`);
    if (!res.ok) throw new Error(`Page ${pageNum}: ${res.status}`);
    const data = await res.json();
    const verses = data.verses || [];
    if (verses.length === 0) throw new Error(`Page ${pageNum}: no verses`);
    return { start: verses[0].verse_key, end: verses[verses.length - 1].verse_key };
}

async function main() {
    const pages = [];
    for (let p = 1; p <= 604; p++) {
        const { start, end } = await fetchPageVerses(p);
        pages.push({ page: p, start_verse_key: start, end_verse_key: end });
        if (p % 100 === 0) console.log(`Fetched page ${p}/604`);
        await new Promise((r) => setTimeout(r, 80));
    }
    const out = { pages };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 0), 'utf8');
    console.log(`Wrote ${OUT_PATH} (${pages.length} entries)`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
