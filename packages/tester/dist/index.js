#! /usr/bin/env node

const jsdom = require('global-jsdom/register')
const tester = require('./tester')
const lemonade = require('lemonadejs');

const vm = require("vm");
const fs = require("fs");

// Define global across the application
global.lemonade = lemonade;
global.tester = tester;

const directory = "./tests";

const files = fs.readdirSync(directory);

files.forEach((file) => {
    const data = fs.readFileSync(directory + "/" + file);
    const script = new vm.Script(data);
    script.runInThisContext();
});

// Run all tests.
tester.run();