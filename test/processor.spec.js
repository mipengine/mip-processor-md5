var fs = require('fs');
var path = require('path');
var Processor = require('../index');
var execSync = require('child_process').execSync;


describe("MD5 Process", function () {
    it("generate md5", function (done) {
    	Processor.md5({
            baseDir: path.resolve(__dirname, 'test-md5'),
            domain: "",
            exts: ['.js'],
            paths: [
                './'
            ],
            outputDir: path.resolve(__dirname, 'tmp')
        });
        setTimeout(function () {
        	var tmp = path.resolve(__dirname, 'tmp');
        	execSync('rm -rf ' + tmp)
        	done(fs.existsSync(tmp));
        }, 1000);
    });
});