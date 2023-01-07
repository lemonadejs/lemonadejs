#! /usr/bin/env node

import 'global-jsdom/register'
import test from '@lemonadejs/test';
import lemonade from 'lemonadejs';
import fs from "fs";

global.lemonade = lemonade;
global.test = test;

const args = process.argv.slice(2);

const directory = args[0] || "tests";

let __pathname = process.cwd().replace(/\\/g, '/');
if (__pathname.indexOf(':') !== -1) {
    __pathname = __pathname.split(':')[1];
}

const files = fs.readdirSync('./' + directory);
for (let i = 0; i < files.length; i++) {
    await import(__pathname + '/' + directory + '/' + files[i]);
}

// Run all tests.
test.run();

// Close process
process.exit(0);