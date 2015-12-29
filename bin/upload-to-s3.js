#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');

const Uploader = require('../index.js');
const pkg = require('../package.json');

function logUploading(file, key) {
    console.log('Uploading:', file, 'to:', key);
}

function logDone(file, Location) {
    console.log(chlk.green('Upload done:', file, 'path', chlk.bold(Location.Location)));
}

program
    .version(pkg.version)
    .usage('[options] <directory>')
    .option('-b, --bucket <bucket>', 'Target bucket')
    .option('-p, --prefix <prefix>', 'Prefix to uploaded files')
    .option('-f, --flatten <flatten>', 'Flatten folder structure', true)
    .option('-s,--strip-ansi', 'Strip ansi colors', false)
    .parse(process.argv);

const opts = {
    prefix: program.prefix,
    flatten: String(program.flatten) === 'true'
};

const uploader = new Uploader(program.bucket, program.args[0], opts);
const chlk = new chalk.constructor({ enabled: !program.stripAnsi });

uploader
    .on('uploading', logUploading)
    .on('done', logDone)
    .on('error', console.error)
    .start();
