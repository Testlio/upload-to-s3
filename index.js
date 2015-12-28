'use strict';

const fs = require('fs');
const events = require('events');
const assert = require('assert');
const file = require('file');
const Aws = require('aws-sdk');
const path = require('path');

const consts = require('./consts.js');

function getStream(path, cb, thisArg) {
    const stream = fs.createReadStream(path);
    stream.on('error', cb.bind(thisArg));
    stream.on('open', cb.bind(thisArg, null, stream));
}

function isDirectory(path, cb) {
    fs.lstat(path, function(err, stat) {
        if (err) { return cb(err); }
        cb(null, stat.isDirectory());
    });
}

class Uploader extends events.EventEmitter {
    constructor (bucket, target, opts) {
        assert(bucket, 'Bucket needs to be defined');
        assert(target, 'Target directory needs to be defined');
        super();
        this.opts = opts || {};
        this.bucket = bucket;
        this.target = target;
        this.s3 = new Aws.S3();
    }

    start() {
        isDirectory(this.target, this._wrapError(function(res) {
            this.isDirectory = res;
            if (res) { return this._walkDir(this.target); }
            return this._uploadFile(this.target);
        }));
        return this;
    }

    _walkDir(dir) {
        file.walk(dir, this._wrapError(function(start, dirs, files) {
            files.forEach(this._uploadFile, this);
        }));
    }

    _removeAssetTargetDir(file) {
        const dirname = path.resolve(path.dirname(this.target));
        const res = path.resolve(file).replace(dirname, '');
        return this.isDirectory ? res.replace(this.target, '') : res;
    }

    _getTargetFilename(file) {
        const shortName = this.opts.flatten ? this._removeAssetTargetDir(file) : file;
        const prefix = this.opts.prefix;
        if (!prefix) {
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
            const key = this._getTargetFilename(file);
            this.emit(consts.UPLOADING, file, key);
            this.s3.upload({
                Bucket: this.bucket,
                Key: key,
                Body: stream
            }, this._wrapError(function(data) {
                this.emit(consts.DONE, file, data);
            }));
        }), this);
    }
}

module.exports = Uploader;
