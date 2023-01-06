#! /usr/bin/env node

import 'global-jsdom/register'
import tester from './tester.js';
import lemonade from 'lemonadejs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";

global.lemonade = lemonade;
global.tester = tester;

const args = process.argv.slice(2);

const directory = args[0] || "tests";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __pathname = path.relative(__dirname, process.cwd()).replace(/\\/g, '/');

const files = fs.readdirSync('./' + directory);
for (let i = 0; i < files.length; i++) {
    await import(__pathname + '/' + directory + '/' + files[i]);
}

// Run all tests.
tester.run();

// Close process
process.exit(0);