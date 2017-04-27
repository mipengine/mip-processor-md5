mip-processor-md5
===========

MIP Processor For FILE MD5

<a href="https://circleci.com/gh/mipengine/mip-processor-md5/tree/master"><img src="https://img.shields.io/circleci/project/mipengine/mip-processor-md5/master.svg?style=flat-square" alt="Build Status"></a>

MIP Processor For File MD5

### usage

```
var Processor = require('mip-processor-md5');
Processor.md5({
	baseUrl: '',
	domain: '',
	exts: ['.jpg'...],
	paths: [
	    './src/',
	    ...
	],
	outputDir: ''
});
```