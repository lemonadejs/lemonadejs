const jsdom = require('global-jsdom/register')
const tester = require('packages/tester/dist/index')
const lemonade = require('dist/lemonade');
const vm = require("vm");
const fs = require("fs");

// Define global across the application
global.lemonade = lemonade;
global.tester = tester;

let data = fs.readFileSync('./tests/general.js');
const script = new vm.Script(data);
script.runInThisContext();

// Run all tests. Change that later TODO:
tester.run();