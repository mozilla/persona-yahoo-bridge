/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var config = require('./configuration'),
    logger = require('./logging').logger,
    Memcached = require('memcached'),
    statsd = require('./statsd');

var ip_ports = config.get('memcached.ip_port_list');

exports.health = function(cb) {
  var _m = new Memcached(ip_ports, {timeout: 1000, retry: 500, retries: 0});
  _m.connect(ip_ports, function(err, conn) {
    _m.end();
    if (err || ! conn) {
      cb(err || "Unable to connect to memcached");
    } else {
      cb(null);
    }
  });
};

exports.saveAssociation = function(handle, provider, algorithm, secret, expiresIn, cb) {
  if (typeof handle !== 'string' ||
      typeof provider !== 'object' ||
      typeof algorithm !== 'string' ||
      typeof secret !== 'string' ||
      typeof expiresIn !== 'number' ||
      typeof cb !== 'function') {
    return cb("Bad input to saveAssociation");
  }

  var memcached = new Memcached(ip_ports, {timeout: 1000});
  var value = JSON.stringify({provider: provider, algorithm: algorithm, secret: secret});
  memcached.set(handle, value, expiresIn, function (err, ok) {
    memcached.end();
    if (err) {
      statsd.increment('assoc_store.memcached.set.error');
      logger.error(err);
      cb(err);
    } else if (! ok) {
      statsd.increment('assoc_store.memcached.set.failure');
      cb('Unable to set assoc handle in memcached');
    } else {
      statsd.increment('assoc_store.memcached.set.ok');
      cb();
    }
  });
};

exports.loadAssociation = function(handle, cb) {
  if (typeof handle !== 'string' ||
      typeof cb !== 'function') {
    return cb("Bad input to loadAssociation");
  }

  var memcached = new Memcached(ip_ports, {timeout: 1000});
  memcached.get(handle, function (err, res) {
    memcached.end();
    if (err) {
      statsd.increment('assoc_store.memcached.get.error');
      logger.error(err);
      cb(err);
    } else {
      statsd.increment('assoc_store.memcached.get.ok');
      var data = JSON.parse(res);
      cb(null, data.provider, data.algorithm, data.secret);
    }
  });
};