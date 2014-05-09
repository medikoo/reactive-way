'use strict';

var count     = require('es5-ext/object/count')
  , deferred  = require('deferred')
  , resolve   = require('path').resolve
  , writeFile = require('fs2/write-file')
  , webmake   = require('./webmake')

  , clientProgram = resolve(__dirname, '../client/index.js')
  , clientBundle = resolve(__dirname, '../public/main.js')
  , tplsPath = resolve(__dirname, '../client/examples');

module.exports = function (env) {
	var promise;
	if (env.dev) return deferred(null);
	promise = webmake(clientProgram, tplsPath);
	return promise(function (src) {
		return writeFile(clientBundle, src);
	}).aside(function () {
		console.log("Webmake OK [" + promise.parser.modulesFiles.length +
			" modules from " + count(promise.parser.packages) + " packages in " +
			(promise.time / 1000).toFixed(2) + "s]");
	});
};
