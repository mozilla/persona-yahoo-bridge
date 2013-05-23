/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
vows = require('vows'),
sekrit = require('../lib/sekrit');

var suite = vows.describe('sekrit-test');

suite.addBatch({
  'Sekrit signing': {
    topic: function() { sekrit.createPinCode(this.callback); },
    'We can sign emails': function(err, pin) {
        assert.isNull(err);
        assert.equal(6, pin.length);
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
