'use strict';

const fs = require('fs');
const events = require('events');
const assert = require('assert');
const file = require('file');
const Aws = require('aws-sdk');
const path = require('path');

const consts = require('./consts.js');

const buildDir = path.join(__dirname, 'build/');

const s3 = new Aws.S3();

function getStream(path, cb, thisArg) {
    const stream = fs.createReadStream(path);
    stream.on('error', cb.bind(thisArg));
    stream.on('open', cb.bind(thisArg, null, stream));
}

class Uploader extends events.EventEmitter {
    constructor (bucket, targetDir, opts) {
        assert(bucket, 'Bucket needs to be defined');
        assert(targetDir, 'Target directory needs to be defined');
        super();
        this.opts = opts || {};
        this.bucket = bucket;
        this.targetDir = targetDir;
    }

    start() {
        file.walk(this.targetDir, this._wrapError(function(start, dirs, files) {
            files.forEach(this._uploadFile, this);
        }));
        return this;
    }

    _removeAssetTargetDir(file) {
        return path.resolve('./', file).replace(path.resolve(this.targetDir), '');
    }

    _getTargetFilename(file) {
        const shortName = this._removeAssetTargetDir(file);
        if (!this.opts.prefix) {
            return shortName;
        }
        return path.join(this.opts.prefix, shortName);
    }

    // Helper function for binding all node style callbacks.
    // Will handle error emitting from callbacks.
    // Will trigger the target FN if no error is provided.
    _wrapError(fn) {
        return function(err) {
            if (err) { return this.emit(consts.ERROR, err); }
            [].shift.apply(arguments);
            return fn.apply(this, arguments);
        }.bind(this);
    }

    _uploadFile(file) {
        getStream(file, this._wrapError(function(stream) {
            this.emit(consts.UPLOADING, file);
            s3.putObject({
                Bucket: this.bucket,
                Key: this._getTargetFilename(file),
                Body: stream
            }, this._wrapError(function() {
                this.emit(consts.DONE, file);
            }));
        }), this);
    }
}

module.exports = Uploader;
