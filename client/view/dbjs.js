'use strict';

// Initialize database
var Database = require('dbjs');
var db = new Database();

// Import needed Type extensions
require('dbjs-ext/string/string-line')(db);
require('dbjs-ext/date-time/date')(db);

// Create Person model
db.Object.extend('Person', {
	firstName: { type: db.StringLine, required: true },
	lastName: { type: db.StringLine, required: true },
	birthDate: { type: db.Date, required: true }
});

// Configure DOM bindings
require('dbjs-dom')(db);
require('dbjs-dom/input/string/string-line')(db);
require('dbjs-dom/input/date-time/date')(db);

// Configure domjs bindings
var domjs = require('../domjs');
var input = require('dbjs-domjs/input')(domjs);

// Bind persistent database (localStorage)
var lsPrefix = 'dbjs:';
var serialize = require('dbjs/_setup/serialize/value');
var unserialize = require('dbjs/_setup/unserialize/value');
var Event = require('dbjs/_setup/event');
// Unserialize
Object.keys(localStorage).forEach(function (key) {
	var data = localStorage[key];
	if (typeof data !== 'string') return; // `length` in Opera
	if (key.indexOf(lsPrefix) !== 0) return;
	key = key.slice(lsPrefix.length);
	var stamp, value, obj;
	stamp = Number(data.split('.', 1)[0]);
	value = unserialize(data.slice(String(stamp).length + 1), db.objects);
	if (value === undefined) return;
	obj = db.objects.unserialize(key, value);
	if (obj == null) return;
	new Event(obj, value, stamp); //jslint: ignore
});
// Serialize on update
db.objects.on('update', function (event) {
	var value;
	if (event.value === undefined) {
		delete localStorage[lsPrefix + event.object.__valueId__];
		return;
	}
	value = serialize(event.value);
	localStorage[lsPrefix + event.object.__valueId__] = event.stamp + '.' + value;
});

// Configure the view
module.exports = function () {
	var onDelete = function () { db.objects.delete(db.Person.getById(this.dataset.id)); };
	var onOpenEdit = function () {
		this.classList.add('hidden');
		this.nextSibling.classList.remove('hidden');
	};
	var onSubmit = function () {
		try {
			this._dbjsInput.observable.value =
				this._dbjsInput.observable.descriptor.type.fromInputValue(this.value);
		} catch (e) {
			console.error(e.stack);
			alert(e.message);
			return;
		}
		this.classList.add('hidden');
		this.previousSibling.classList.remove('hidden');
	};
	var onKeyPress = function (e) {
		if (e.keyCode === 13) onSubmit.call(this);
	};
	var onCreate = function () {
		try {
			db.Person({
				firstName: db.StringLine.fromInputValue(this.firstName.value),
				lastName: db.StringLine.fromInputValue(this.lastName.value),
				birthDate: db.Date.fromInputValue(this.birthDate.value)
			});
		} catch (e) {
			console.error(e.stack);
			alert(e);
			return;
		}
		this.reset();
		return false;
	};
	var logBody;
	db.objects.on('update', function (event) {
		logBody.insertBefore(tr(td(event.stamp), td(event.object.__valueId__),
			td(serialize(event.value))), logBody.firstChild);
	});

	return div(div(table(thead(th("First name"), th("Last name "), th("Date of birth"), th(" ")),
		tbody(db.Person.instances, function (person) {
			return tr(td(a({ onclick: onOpenEdit }, person._firstName),
				input({ class: 'hidden', dbjs: person._firstName, onkeypress: onKeyPress })),
				td(a({ onclick: onOpenEdit }, person._lastName),
					input({ class: 'hidden', dbjs: person._lastName, onkeypress: onKeyPress })),
				td(a({ onclick: onOpenEdit }, person._birthDate),
					input({ class: 'hidden', dbjs: person._birthDate, onkeypress: onKeyPress })),
				td(button({ type: 'button', onclick: onDelete, 'data-id': person.__id__ }, "Delete")));
		})),
		form({ onsubmit: onCreate }, table(tbody(
			tr(td(input({ dbjs: db.Person.prototype._firstName, name: 'firstName',
				placeholder: "First Name" })),
				td(input({ dbjs: db.Person.prototype._lastName, name: 'lastName',
					placeholder: "Last Name" })),
				td(input({ dbjs: db.Person.prototype._birthDate, name: 'birthDate',
					placeholder: "Date of birth" })),
				td(button({ type: 'submit' }, "+")))
		)))),
		div(table({ class: 'serialize-log' }, thead(th("Stamp"), th("Key"), th("Value")),
			logBody = tbody())));
};
