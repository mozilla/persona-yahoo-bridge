/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Captures metadata about client side assets for use with compress
 * and cachify */

const
_ = require('underscore');

exports.sources = {
  js: {
    '/js/error.min.js': ['/js/error.js']
  },
  css: {
    '/css/style.min.css': ['/css/style.css'],
    '/css/ie8.min.css': ['/css/ie8.css']
  }
};
/*
var flatten = function (map) {
    console.log('map= ', Object.keys(map));
  var rv = {};
    var keys = Object.keys(map);
    for (var i in Object.keys(map)) {

	var key = keys[i];
	console.log('key=' + key + ' map[key]= ', map[key]);
    var subKeys = Object.keys(map[key]);
    for (var k in Object.keys(map[key])) {
      var subKey = map[key][k];
      rv[subKey] = map[key][subKey];
    }
  }
    console.log(rv);
  return rv;
};
*/
exports.cachifyList = _.extend({}, exports.sources['js'], exports.sources['css']);