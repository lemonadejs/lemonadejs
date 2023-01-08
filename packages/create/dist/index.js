#! /usr/bin/env node

'use strict';

const admZip = require('adm-zip');
const request = require('superagent');
const fs = require('fs');
const exec = require('child_process');

const valid = function(data) {
    var pattern = new RegExp(/^[a-zA-Z0-9\_\-\.\s+]+$/);
    return data && pattern.test(data) ? true : false;
}

const error = function(error) {
    console.error(error);
    process.exit(1);
}

const args = process.argv.slice(2);

const repoName = 'base';
const href = `https://github.com/lemonadejs/${repoName}/archive`;
const zipFile = 'main.zip';
const source = `${href}/${zipFile}`;
const extractEntryTo = `${repoName}-main/`;
const out = "./" + (args[0] || 'myApp');

if (! args[0] || ! valid(args[0])) {
    error('Project name is not a valid name');
} else if (fs.existsSync(args[0])) {
    error('You cannot create a new project to an existing folder');
} else {
    request.get(source).on('error', function(error) {
        console.log(error);
    }).pipe(fs.createWriteStream(zipFile)).on('finish', function() {
        var zip = new admZip(zipFile);
        zip.extractEntryTo(extractEntryTo, './', true);
        fs.unlink('main.zip', function() {});
        fs.rename('./' + extractEntryTo, out, function() {
            process.chdir(out);
            exec.execSync(`npm i`);
            // Close process
            process.exit(0);
        });
    });
}
