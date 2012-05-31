const assert = require('assert'),
      vows = require('vows'),
      request = require('request'),
      routes = require('../routes'),
      start_stop = require('./lib/start-stop'),
      util = require('util');


var suite = vows.describe('gmail-and-general-proxy-test');

// start up a pristine server
start_stop.addStartupBatches(suite);

function base_url (path) {
  return util.format('%s%s', start_stop.base_url, path);
}

suite.addBatch({
  'Anonymous request with gmail.com email is sent to the Goog.': {
    topic: function () {
      var opts = {
        followRedirect: false
      };
      request(base_url('/proxy/alice%40gmail.com'), opts, this.callback);
    },
    'Without issue': function (err, r, body) {
      assert.isNull(err);
    },
    'We get a redirect': function (err, r, body) {
      assert.equal(r.statusCode, 302);
      assert.equal(r.headers.location.indexOf('https://www.google.com/accounts/o8/ud'), 0);
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
