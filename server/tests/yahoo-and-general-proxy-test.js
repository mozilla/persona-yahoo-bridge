/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
vows = require('vows'),
request = require('request'),
routes = require('../routes'),
start_stop = require('./lib/start-stop'),
util = require('util');

var suite = vows.describe('yahoo-and-general-proxy-test');

// start up a pristine server
start_stop.addStartupBatches(suite);

function base_url (path) {
  return util.format('%s%s', start_stop.base_url, path);
}

suite.addBatch({
  'Anonymous request with yahoo.com email is sent to Yahoo.': {
    topic: function () {
      var opts = {
        followRedirect: false,
        timeout: 3000
      };
      request(base_url('/proxy/alice%40yahoo.com'), opts, this.callback);
    },
    'Without issue': function (err, r, body) {
      assert.isNull(err);
    },
    'We get a redirect': function (err, r, body) {
      assert.ok(r);
      assert.equal(r.statusCode, 302);
      assert.equal(r.headers.location.indexOf('https://open.login.yahooapis.com/openid/op/auth?'),
                   0,
                   'redirect [' + r.headers.location + '] is yahoo');
    }
  }
});

start_stop.addShutdownBatches(suite);

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
