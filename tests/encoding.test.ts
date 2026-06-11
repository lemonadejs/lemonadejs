/**
 * Encoding guard: every text file in the repo must be clean UTF-8 with no
 * CP1252 mojibake (â€”, â€™, Ã©, …). The bytes have always been correct —
 * reviewers reading files through a CP1252 console see mangled em-dashes
 * that are NOT in the files — but PowerShell editing has corrupted files
 * before (a documented hazard), so the claim stays machine-checked.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The UTF-8 bytes of 'â' and 'Ã' followed by continuation bytes only occur
// in double-encoded text — never in legitimate English/code content
const MOJIBAKE = [Buffer.from('â€', 'utf8'), Buffer.from('Ã©', 'utf8'), Buffer.from('Â ', 'utf8')];

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
