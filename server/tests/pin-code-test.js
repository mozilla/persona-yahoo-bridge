/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
config = require('../lib/configuration'),
vows = require('vows'),
pinCode = require('../lib/pin_code'),
session = require('../lib/session_context');

var suite = vows.describe('pin-code-test');

var goodTime, badTime;

const PIN_LEN = config.get('pin_length');

suite.addBatch({
  'PIN Codes': {
    // Fake Request
    topic: {
      params: { email: 'a@foo.com' },
      pincodedb: {},
      session: { claim: 'a@foo.com'}
    },
    'We can generate a secret': {
      topic: function(req) {
        pinCode.generateSecret(req, this.callback);
      },
      'We can generate a PIN code': function(err, pin) {
        assert.isNull(err);
        assert.equal(PIN_LEN, pin.length);
        assert.equal(false, isNaN(parseInt(pin, 10)));
      },
      'Validate': {
        topic: function(err, pin) {
          var req = {
            body: { pin: pin },
            pincodedb: { expected_pin: pin }
          };
          goodTime = new Date();
          pinCode.validateSecret(req, this.callback);
        },
        'Is good for matches': function(err, isValid) {
          assert.isNull(err);
          assert.ok(isValid);
            var end = new Date();
            assert.ok(end - goodTime >= 1000,
                      'Was hoping for more than 1000 millis, but got ' + (end - goodTime));
        }
      },
      'Not Valid': {
        topic: function(err, pin) {
          var req = {
            body: { pin: '123456' },
            pincodedb: { expected_pin: pin }
          };
          badTime = new Date();
          pinCode.validateSecret(req, this.callback);
        },
        'Will not match': function(err, isValid) {
          assert.isNull(err);
          assert.equal(false, isValid);
            var end = new Date();
            assert.ok(end - badTime >= 1000,
                      'Was hoping for more than 1000 millis, but got ' + (end - badTime));
        }
      }
    },
    'Marking an address verified will validate': function(req) {
      pinCode.markVerified('a@foo.com', req);
      assert.equal(pinCode.wasValidated('a@foo.com', req), true);
      assert.equal(pinCode.wasValidated('b@foo.com', req), false);
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
