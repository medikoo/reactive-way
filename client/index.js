'use strict';

Error.stackTraceLimit = Infinity;

var env, options, root, container, countP;

try {
	env = require('../env');
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND') throw e;
	env = {};
}
root = env.root || '/';

require('./domjs');

// Inject slides
document.body.appendChild(container = document.createElement('article')).innerHTML
	= require('../slides')
		.replace(/ src="\/(?!\/)/g, ' src="' + root);

// Syntax highlight
require('./lib/highlight');

// Bespoke engine + necessary plugins
require('bespoke');
bespoke.plugins.history = require('bespoke-history');
require('bespoke-keys');
bespoke.plugins.notes = require('bespoke-notes');
require('bespoke-progress');
bespoke.plugins.substeps = require('bespoke-substeps');
require('bespoke-scale');
require('bespoke-touch');

options = {
	history: env.root || true,
	keys: true,
	notes: true,
	progress: true,
	scale: true,
	substeps: true,
	touch: true
};

if (env.sync) {
	bespoke.plugins.sync = require('bespoke-sync/client');
	options.sync = { log: true, ssePath: root + 'sse-slides/',
		xhrPath: root + 'slide/' };
}

// Intialize slides engine
window.deck = bespoke.from('article', options);

// Preload images
require('./lib/preload-images');

// Initialize examples
require('./lib/observable-dom');
document.getElementById('domjs-example')
	.appendChild(require('./view/reactive-dom')());
document.getElementById('dbjs-example')
	.appendChild(require('./view/dbjs')());

// Log total number of slides
console.log("Total slides:", container.children.length);
if (env.dev) {
	countP = document.body.appendChild(document.createElement('p'));
	countP.style.position = 'absolute';
	countP.style.fontSize = '16px';
	countP.style.bottom = '20px';
	countP.style.right = '20px';
	countP.innerHTML = "[" + container.children.length + "]";
}
