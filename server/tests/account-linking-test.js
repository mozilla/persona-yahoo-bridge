/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
vows = require('vows'),
accountLink = require('../lib/account_linking');

var suite = vows.describe('account-linking-test');

suite.addBatch({
  'Account Linking': {
    topic: { accountdb: {}},
    'We can record a link': function(req) {
      accountLink.recordLink('a@foo.com', 'b@foo.com', req);
      assert.ok(accountLink.validateLinkage('a@foo.com', 'b@foo.com', req));
    },
    'links are not transitive': function(req) {
      accountLink.recordLink('a@foo.com', 'b@foo.com', req);
      assert.ok(accountLink.validateLinkage('a@foo.com', 'b@foo.com', req));
      assert.equal(false, accountLink.validateLinkage('b@foo.com', 'a@foo.com', req));
    },
    'unknown links are not valid': function(req) {
      assert.equal(false, accountLink.validateLinkage('unknown@foo.com', 'b@foo.com', req));
      assert.equal(false, accountLink.validateLinkage('b@foo.com', 'unknown@foo.com', req));
    },
    'Calling record multiple times only creates one record': function(req) {
      req = { accountdb: {} };
      accountLink.recordLink('a@foo.com', 'b@foo.com', req);
      accountLink.recordLink('a@foo.com', 'b@foo.com', req);
      accountLink.recordLink('y@foo.com', 'z@foo.com', req);
      accountLink.recordLink('a@foo.com', 'b@foo.com', req);
      var links = accountLink.getAllLinks(req);
      assert.equal(links.length, 2);
    },
    'We can getAllLinks': function(req) {
      req = { accountdb: {} };
      accountLink.recordLink('a@foo.com', 'b@foo.com', req);
      accountLink.recordLink('y@foo.com', 'z@foo.com', req);
      assert.equal(false, accountLink.validateLinkage('a@foo.com', 'z@foo.com', req));

      var links = accountLink.getAllLinks(req),
          sawA = false,
          sawY = false;

      assert.equal(links.length, 2);

      for (var i=0; i < links.length; i++) {
        if ('a@foo.com' === links[i][0]) {
          sawA = true;
        } else if ('y@foo.com' === links[i][0]) {
          sawY = true;
        }
      }
      assert.ok(sawA);
      assert.ok(sawY);
    }
  }
});

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
