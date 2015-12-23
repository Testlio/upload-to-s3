#!/usr/bin/env node
const program = require('commander');
const Uploader = require('../index.js');

const pkg = require('../package.json');

function log(eventType) {
    return function(data) {
        console.log(eventType, data);
    };
}

program
    .version(pkg.version)
    .usage('[options] <directory>')
    .option('-b --bucket <bucket>', 'Target bucket')
    .option('-p --prefix <prefix>', 'Prefix to uploaded files')
    .parse(process.argv);

const opts = {
    prefix: program.prefix
};

const uploader = new Uploader(program.bucket, program.args[0], opts);

uploader
    .on('uploading', log('uploading'))
    .on('done', log('done'))
    .on('error', log('error'))
    .start();
