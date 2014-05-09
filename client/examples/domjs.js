'use strict';

var Observable = require('observable-value');

module.exports = function () {
	var b = new Observable(2), c = new Observable(3), a = b.add(c);
	var exampleForm = form(table(tbody(
		tr(th("a"), td(a)),
		tr(th("b"), td(input({ name: 'b', value: b }))),
		tr(th("c"), td(input({ name: 'c', value: c })))
	)));
	exampleForm.oninput = function (e) {
		b.value = Number(this.b.value);
		c.value = Number(this.c.value);
	};
	return exampleForm;
};
