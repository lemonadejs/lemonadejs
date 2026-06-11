/**
 * Encoding guard: every text file in the repo must be clean UTF-8 with no
 * CP1252 mojibake (the double-encoded em-dash family). The bytes have
 * always been correct — reviewers reading files through a CP1252 console
 * see mangled characters that are NOT in the files — but PowerShell
 * editing has corrupted files before (a documented hazard), so the claim
 * stays machine-checked.
 *
 * The patterns are built from raw bytes so this file never matches itself.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// UTF-8 encodings of: 'a-circumflex'+euro (mangled em-dash/quote prefix),
// 'A-tilde'+e-acute (mangled accented letters), 'A-circumflex'+space
// (mangled NBSP) — these byte runs only occur in double-encoded text
const MOJIBAKE = [
    Buffer.from([0xc3, 0xa2, 0xe2, 0x82, 0xac]),
    Buffer.from([0xc3, 0x83, 0xc2, 0xa9]),
    Buffer.from([0xc3, 0x82, 0xc2, 0xa0]),
];

const SKIP = new Set(['node_modules', 'dist', '.git', '.probe']);
const TEXT = /\.(md|ts|txt|json|css|html|js|mjs)$/;

const collect = (dir: string, out: string[]): void => {
    for (const name of readdirSync(dir)) {
        if (SKIP.has(name)) {
            continue;
        }
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
            collect(p, out);
        } else if (TEXT.test(name)) {
            out.push(p);
        }
    }
};

describe('encoding: the repo is clean UTF-8', () => {
    it('no text file contains CP1252 mojibake byte sequences', () => {
        const files: string[] = [];
        collect('.', files);
        expect(files.length).toBeGreaterThan(100); // the walk actually walked
        const dirty = files.filter((f) => {
            const buf = readFileSync(f);
            return MOJIBAKE.some((m) => buf.includes(m));
        });
        expect(dirty).toEqual([]);
    });
});
