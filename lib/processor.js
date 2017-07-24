/**
 * @file MIP Processor For MD5 Compile
 * @author smart(smartfutureplayer@gmail.com)
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var CHARSET = 'binary';

function Processor (config) {
	this.config = config;
	this.map = {};
}

/**
 * 开始执行入口
 * @param {Object} config 参数对象
 */
Processor.prototype.exec = function (config) {
	if (!(config.baseDir && config.paths)) {
		return;
	}
	var self = this;
	this.handleFile();
	this.handleMap();
}

/**
 * 遍历目录
 *
 * @inner
 * @param {string} dir 要遍历的目录
 * @param {Function} cb 回调函数
 */
Processor.prototype.traverseDir = function (pth, cb) {
    var self = this;
    var files = fs.readdirSync(pth);
    files.forEach(function (file) {
        var fullPath = path.resolve(pth, file);
        try {
            var stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                self.traverseDir(fullPath, cb);
            } else {
            	cb && cb(fullPath);
            }
        }
        catch (e) {}
    });
}

/**
 * 对配置的文件进行hash处理，并生成 map 文件
 */
Processor.prototype.handleFile = function () {
	var self = this;
	self.config.paths.forEach(function (pth) {
		var file = path.resolve(self.config.baseDir, pth);
		self.traverseDir(file, function (fullPath) {
			var match = false;
			var extName = path.extname(fullPath);
			for (var key in self.config.exts) {
				if (match = extName === self.config.exts[key]) {
					break;
				}
			}
			var fobj = path.parse(fullPath);
			var item = fullPath.split(file);
			var outputPath = item ? path.join(self.config.outputDir, item[1]) : '';
			var dirname = path.dirname(outputPath);
			var fileName = fobj.base;
			var content = fs.readFileSync(fullPath, CHARSET);
			if (match) {
				var md5 = self.md5(content);
				fileName = fobj.name + '_' + md5 + fobj.ext;
			}
			// 打包写入的地址
			outputName = path.resolve(dirname, fileName)
			self.handlePath(dirname);
			fs.writeFileSync(outputName, content, CHARSET);

			// 生成map文件
			var relPath = path.relative(self.config.baseDir, fullPath);
			var outRelPath = relPath.replace(path.basename(relPath), fileName);
			var outRelPathArr = outRelPath.split('/');
			outRelPath = outRelPathArr.splice(1).join('/');

			var mapPath = [];
			if (self.config.domain) {
				mapPath.push(self.config.domain);
			}
			mapPath.push(outRelPath);

			if (outRelPath.indexOf('__MACOSX') >= 0
				|| outRelPath.indexOf('.DS_Store') >= 0
				|| outRelPath.indexOf('Thumbs.db') >= 0) {
				return;
			}
			self.map[relPath] = mapPath.join('/');
		});
	});
}

/**
 * 路径如果不存在则创建路径
 * @param {string} pth 路径
 */
Processor.prototype.handlePath = function (pth) {
    if (!fs.existsSync(pth)) {
        this.handlePath(path.dirname(pth));
        fs.mkdirSync(pth);
    }
}

/**
 * 按位数生成md5串
 * @param {string|Binary} data 数据源
 * @param {Number} len 长度
 * @return {String} md5串
 */
Processor.prototype.md5 = function (data, len) {
	var md5sum = crypto.createHash('md5'),
    encoding = typeof data === 'string' ? 'utf8' : 'binary';
    md5sum.update(data, encoding);
    len = len || 7;
    return md5sum.digest('hex').substring(0, len);
}

/**
 * 处理文件中外链 map
 */
Processor.prototype.handleMap = function () {
	var self = this;
	var cssReg = new RegExp('url\\s*\\(\\s*[\'\"]*\\s*([^\\)\"\']*)\\s*[\'\"]*\\s*\\)', 'gi');
	var htmlReg = new RegExp('src\\s*=\\s*[\'\"]*\\s*([^\\>\"\']*)\\s*[\'\"]*\\s*', 'gi');
	self.config.paths.forEach(function (pth) {
		var file = path.resolve(self.config.baseDir, pth);
		self.traverseDir(file, function (fullPath) {
			var results;
			var filePath;
			var outputPath;
			var needWrite = false;
			var content = fs.readFileSync(fullPath, CHARSET);
			var reg;
			if (fullPath.match(/\.(css|less|sass)$/)) {
				reg = cssReg;
			} else if (fullPath.match(/\.(mustache|html)$/)) {
				reg = htmlReg;
			}
			var ct = content;
			while ((results = reg.exec(ct)) != null)  {
				if (results && results.length > 0) {
	                var name = results[1];
	                name = name.trim();
	                var items = name.split(/\?|\#/);
	                name = items && items.length > 1 ? items[0] : name;
	                filePath = path.resolve(path.dirname(fullPath), name);
	                var relPath = path.relative(self.config.baseDir, filePath);
	                if (self.map && self.map[relPath]) {
	                	needWrite = true;
	                	content = content.replace(name, self.map[relPath]);
	                }
	            }
			}
			if (needWrite) {
				var rel = path.relative(self.config.baseDir, fullPath);
				var pthArr = rel.split('/');
				rel = pthArr.splice(1).join('/');
				outputPath = path.resolve(self.config.outputDir, rel);
				fs.writeFileSync(outputPath, content);
			}
		});
	});
}

/**
 * 按位数生成md5串
 * @param {String|Buffer} data 数据源
 * @param {Number} len 长度
 * @return {String} md5串
 */
exports.md5 = function(config) {
	var processor = new Processor(config);
	processor.exec(config);
}