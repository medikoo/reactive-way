'use strict';

var aFrom           = require('es5-ext/array/from')
  , isObject        = require('es5-ext/object/is-object')
  , d               = require('d')
  , memoize         = require('memoizee/plain')
  , getNormalizer   = require('memoizee/normalizers/get-1')
  , remove          = require('dom-ext/node/#/remove')
  , normalize       = require('dom-ext/document/#/normalize')
  , isDF            = require('dom-ext/document-fragment/is-document-fragment')
  , observable      = require('observable-value').prototype

  , isArray = Array.isArray;

Object.defineProperties(observable, {
	toDOM: d(function (document) {
		var mark = document.createTextNode(''), df, toDOM, current;

		toDOM = memoize(function (value) {
			var dom = normalize.call(document, value);
			if (!isDF(dom)) return dom;
			return dom.firstChild ? aFrom(dom.childNodes) : null;
		}, { normalizer: getNormalizer() });
		this.on('change', function (event) {
			var parent, value = event.newValue;
			if (current) {
				if (isArray(current)) {
					current.forEach(function (el) { remove.call(el); });
				} else {
					remove.call(current);
				}
				current = null;
			}
			if (!isObject(value)) {
				mark.data = (value == null) ? '' : String(value);
				return;
			}
			mark.data = '';
			current = toDOM(value);
			if (!current) return;
			parent = mark.parentNode;
			if (!parent) throw new TypeError("Cannot update DOM");

			if (isArray(current)) {
				current.forEach(function (el) {
					parent.insertBefore(el, mark);
				});
				return;
			}
			parent.insertBefore(current, mark);
		});
		if (!isObject(this.value)) {
			mark.data = (this.value == null) ? '' : String(this.value);
			return mark;
		}
		current = toDOM(this.value);
		if (!current) return mark;
		df = document.createDocumentFragment();
		if (isArray(current)) current.forEach(df.appendChild, df);
		else df.appendChild(current);
		df.appendChild(mark);
		return df;
	}),
	toDOMAttr: d(function (element, name) {
		this.on('change', function (event) {
			var value = event.newValue;
			if (value == null) element.removeAttribute(name);
			else element.setAttribute(name, value);
		});
		if (this.value == null) element.removeAttribute(name);
		else element.setAttribute(name, this.value);
		return this;
	})
});
