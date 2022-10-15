#! /usr/bin/env node

const process = require('process');
const fs = require('fs');
const clone = require('git-clone');

const valid = function(data) {
    var pattern = new RegExp(/^[a-zA-Z0-9\_\-\.\s+]+$/);
    return data && pattern.test(data) ? true : false;
}

const error = function(error) {
    console.error(error);
    process.exit(1);
}

const args = process.argv.slice(2);

if (! args[0] || ! valid(args[0])) {
    error('Project name is not a valid name');
} else if (fs.existsSync(args[0])) {
    error('You cannot create a new project to an existing folder');
} else {
    // Create folder
    fs.mkdirSync(args[0]);
    // Go inside the folder
    process.chdir(args[0]);
    // Clone repository
    clone('https://github.com/lemonadejs/base.git', '.', [], function() {
        console.log('Done!');
        process.exit(0);
    });
}