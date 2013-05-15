/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
config = require('../lib/configuration'),
vows = require('vows'),
sekrit = require('../lib/sekrit');

const PIN_LEN = config.get('pin_length');

var suite = vows.describe('sekrit-test');

suite.addBatch({
  'Sekrit PINs': {
    topic: function() { sekrit.createPinCode(this.callback); },
    'We can create PINs': function(err, pin) {
        assert.isNull(err);
        assert.equal(PIN_LEN, pin.length);
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
