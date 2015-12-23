# Recursive upload files to s3

> Recursively walks through target folder and streams all found files to specified s3 bucket

## Install

`$ npm i -g upload-to-s3`

## Usage

### Cli

`$ upload-to-s3 --help`


Example:

Upload everything from `./build` directory to `wombo-combo-bucket` with prepended `0.0.3` path.

```
$ upload-to-s3 -b wombo-combo-bucket -p 0.0.3 ./build/
```

### Node

```
const Uploader = require('upload-to-s3');
const uploader = new Uploader('bucket name', 'target dir', {
    prefix: 'prefix'
});

uploader
    .on('uploading', log('uploading'))
    .on('done', log('done'))
    .on('error', log('error'))
    .start();
```
