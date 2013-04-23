/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
vows = require('vows'),
sekrit = require('../lib/sekrit');

var suite = vows.describe('account-linking-test');

suite.addBatch({
  'Sekrit signing': {
    topic: function() {
      this.callback(null, new sekrit({ secret: 'Boo ya' }));
    },
    'We can sign emails': function(err, secret) {
      secret.createAccountLink('a@b.com', 'y@z.com', function(err, token) {
        secret.checkAccountLink(token, function(err, emails) {
          assert(! err);
          assert.equal(emails[0], 'a@b.com');
          assert.equal(emails[1], 'y@z.com');
        });
      });
    },
    'We can not make up tokens': function(err, secret) {
      // Valid token except a@b.com is foo@bar.com
      var token = 'u58fUi60G8z4ZcvTWYz_kA.Zm9vQGJhci5jb20.eUB6LmNvbQ.wp7Di8KD' +
                  'wrBWw6VcERDDsMOccsKAwqfDrn0cDcOza8OXw7ItwpPCm0_DoAbCmcKFwq' +
                  'zChA';
      secret.checkAccountLink(token, function(err, emails) {
        assert.ok(err);
        assert.equal(emails.length, 0);
       });
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
