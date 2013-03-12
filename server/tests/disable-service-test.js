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

var suite = vows.describe('disable-service-test');

process.env.DISABLE_BIGTENT = true;

// start up a pristine server
start_stop.addStartupBatches(suite);

function base_url (path) {
  return util.format('%s%s', start_stop.base_url, path);
}

suite.addBatch({
  'A Disbaled service returnsed a disabled well-known.': {
    topic: function() {
      var opts = {
        followRedirect: false,
        timeout: 3000
      };
      request(base_url('/.well-known/browserid'), opts, this.callback);
    },
    'Without issue': function(err, r, body) {
      assert.isNull(err);
      assert.equal(r.statusCode, 200);
    },
    'JSON document with expected values': function(err, r, body) {
      var wellKnown = JSON.parse(body);
      assert.equal(wellKnown.disabled, true);
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
