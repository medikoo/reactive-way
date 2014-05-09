'use strict';

var customError   = require('es5-ext/error/custom')
  , deferred      = require('deferred')
  , resolve       = require('path').resolve
  , readdir       = require('fs2/readdir')
  , readFile      = require('fs2/read-file')
  , webmakeParser = require('webmake/lib/parser')

  , now = Date.now, stringify = JSON.stringify
  , templatePath = resolve(__dirname, 'webmake.tpl')
  , separator = (process.platform === 'win32') ? '/[\\\\/]/' : '\'/\'';

module.exports = exports = function (programPath, tplsPath, cb) {
	var promise, time = now(), parser, programLocalPath;
	parser = webmakeParser({ cache: true, prettyOutput: false });
	promise = deferred(parser.readInput(programPath),
		readdir(tplsPath, { depth: Infinity, pattern: /\.js$/ })).spread(
		function (path, tpls) {
			programLocalPath = path;
			return deferred.map(tpls.map(function (tpl) {
				return resolve(tplsPath, tpl);
			}), parser.readInput, parser);
		}
	)(readFile(templatePath))(function (tpl) {
		var src, tpls, appPath = programLocalPath.split('/').slice(0, -2), index
		  , appModules;

		src = String(tpl).replace('SEPARATOR', separator)
			.replace('EXTENSIONS', stringify(parser.extNames))
			.replace('APPLICATION_NAME', '[' + stringify(appPath[0]) + ']');
		appModules = parser.modules;
		appModules = appModules[appPath[0]].client;
		tpls = appModules.examples;
		if (!tpls) throw customError("Missing templates", 'NO_TEMPLATES');
		delete appModules.examples;
		index = src.indexOf('INIT_MODULES');
		src = src.slice(0, index) + parser.toString() +
			src.slice(index + 'INIT_MODULES'.length);
		index = src.lastIndexOf('TEMPLATE_MODULES');
		src = src.slice(0, index) + '{\n' +
			webmakeParser.modulesToString.call(tpls, 2, {}) + '\n\t\t}' +
			src.slice(index + 'TEMPLATE_MODULES'.length);
		return src + '(' + stringify(programLocalPath) + ');\n';
	}).aside(function () {
		promise.parser = parser;
		promise.time = now() - time;
	}).cb(cb);
	return promise;
};
