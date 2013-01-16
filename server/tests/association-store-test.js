/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
assocStore = require('../lib/association_store'),
config = require('../lib/configuration'),
vows = require('vows'),
start_stop = require('./lib/start-stop'),
util = require('util');

var desc = 'association-store-test';

console.log('Doing health check with ', config.get('memcached.ip_port_list'));
assocStore.health(function(err) {
  console.log('Health check err=', err);
  if (err) {
    var ip_ports = config.get('memcached.ip_port_list');
    console.error('Skipping ' + desc + ' test suite. Unable to connect to memcached:' + JSON.stringify(ip_ports));
    console.error(err);
  } else {
    // TODO: This "optional vows suite" pattern doesn't work.
    // You must run these test via node, not the vows bin. Fix Me.
    setupAndRun();
  }
});

var handle = 't7nsCVDPK19Oy0u_9skIoc24ScfuCAug8hCu.b2cMIbSIYY2Tqc3xqcMrH_0plyKKgrzA9RuYtRjx_5JHOxA2W78n47oI7Sa959nQzmUeqSr4ioBLYBPKaLc_p8lIkIp3GFSPug-',
    provider = {
      endpoint: 'https://open.login.yahooapis.com/openid/op/auth',
      version: 'http://specs.openid.net/auth/2.0'
    },
    algorithm = 'sha256',
    secret = 'ozSac15ZeAAlg0O1nto6aqd0hDZqwfBvgZebEFhDGA8=',
    expires = 14400;

var basicBatch = {
  'We can set an association': {
    topic: function() {
      assocStore.saveAssociation(handle, provider, algorithm, secret, expires, this.callback);
    },
    'Without error or failure': function(err) {
      assert.ifError(err);
    },
    'We can retrieve this association': {
      topic: function(err) {
        assocStore.loadAssociation(handle, this.callback);
      },
      'And it matches what we put in': function(err, aProvider, anAlgorithm, aSecret) {
        assert.ifError(err);
        assert.deepEqual(provider, aProvider);
        assert.equal(algorithm, anAlgorithm);
        assert.equal(secret, aSecret);
      }
    }
  }
};

var badSaveBatch = function(i, handle, provider, algorithm, secret, expiresIn) {
  var rv = {};
  rv['Bad inputs (case #' + i + ') to save causes errors'] = {
    topic: function() {
      assocStore.saveAssociation(handle, provider, algorithm, secret, expiresIn, this.callback);
    },
    'We get a programming error': function(err) {
      assert(err);
    }
  };
  return rv;
};

var badLoadBatch = function(i, handle) {
  rv = {};
  rv['Bad inputs (case #' + i + ') to load causes errors'] = {
    topic: function() {
      assocStore.loadAssociation(handle, this.callback);
    },
    'We get a programming error': function(err) {
      assert(err);
    }
  };
  return rv;
};

var setupAndRun = function() {
  var suite = vows.describe(desc);

  start_stop.addStartupBatches(suite);

  suite.addBatch(basicBatch);
  var badSaveTests = [
    [0, null, null, null, null, null],
    [1, handle, null, null, null, null],
    [2, handle, provider, null, null, null],
    [3, handle, provider, algorithm, null, null],
    [4, handle, provider, algorithm, secret, null],
    [5, handle, provider, algorithm, secret, '17000'],
    [6, expires, handle, provider, algorithm, secret]
  ];
  badSaveTests.forEach(function(bad, i) {
    suite.addBatch(badSaveBatch.apply(badSaveBatch, bad));
  });

  suite.addBatch(badLoadBatch(0, null));
  start_stop.addShutdownBatches(suite);

  if (process.argv[1] === __filename) {
    suite.run();
  } else {
    suite.export(module);
  }
};
