/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint esnext:true */

/* This file is the "provision" activity, which simulates the process of a
 * user with an active session adding a new email with browserid. */

// TODO: move out of this branch, yahoo only

const
certifier = require('../../../lib/certifier'),
client = require('../client'),
config = require('../../../lib/configuration'),
crypto = require('../../../lib/crypto'),
request = require('request'),
userdb = require('loady').userdb,
winston = require('winston');

// Once ever two weeks, our session has expired
exports.probability = (8 / 40.0);

var debug = false;

function cleanup(user) {
  userdb.releaseUser(user);
}

exports.startFunc = function (cfg, cb) {
  var user = userdb.getExistingUser();
  if (!user) {
    winston.warn("can't achieve desired concurrency!  not enough users!");
    return cb("not enough users");
  }
  // Provision, no session
  userdb.clearCookies(user);
  startProvision(user, cfg, cb);
};

// Provisioning, can handle active or no session
function startProvision (user, cfg, cb) {
  user.request.get({
    url: client.url('/provision', cfg),
    followRedirect: false
  }, function (err, r, body) {
    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 200) {
      cleanup(user);
      cb("Expected /provision to be a 200, but was " + r.statusCode);
    } else {
      var csrf = body;
      user.request.get({
        url: client.url('/provision.js', cfg),
        followRedirect: false
      }, function (err, r, body) {
        // Do we have an active session?
        if (body.indexOf('provision([], 0);') !== -1) {
          if (debug) console.log('We have no session');
          startAuth(user, cfg, cb);
        } else {
          if (debug) console.log('We have an active session, done');
          cleanup(user);
          cb(null);
        }
      });
    }
  });
} // startProvision

// Authentication 1
function startAuth (user, cfg, cb) {
  var the_url = client.url('/proxy/' + encodeURIComponent('alice@hotmail.com'), cfg);
  if (debug) console.log('starting Auth on ', the_url);
  user.request.get({
    url: the_url,
    followRedirect: false
  }, function (err, r, body) {
    if (debug) console.log('Got answer from /proxy/ err=', err, 'body=', body);

    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 302) {
      cleanup(user);
      cb("Expected redirect status code, but got " + r.statusCode);
    /*
      headers:
       { 'x-powered-by': 'Express',
         location: 'https://oauth.live.com/authorize?response_type=code&redirect_uri=https%3A%2F%2Fdev.bigtent.mozilla.org%2Fauth%2Fwindowslive%2Fcallback&scope=wl.emails&client_id=00000000440BCC94&type=web_server',
         'set-cookie': [ 'session_state=IcKqw4dBw6HCjVrDp8Kow7w8w7nCq3jCkCQ.wrDDuENEw7JkQyUoDcOpf1cEwqQKwprChMO4worCtMKwG8OVKSLCuk52w5wqw6NID8OyIcOtwrXChHIgY8OvwpprPcKXWisdwpLChijCssKbwpzCuTEnA2TClsKCMAPCjcOcwpRUH8KzA8KLdEg8w4Q9w6TDiw.1341345027910.86400000.w7vDkULDvmbCvcOtQxnCu30EacK1BcO2w7fDhhInw61PwrpOwqfDuMK-f8OpV8K2wq0; path=/; secure; httponly' ],
         connection: 'keep-alive',
         'transfer-encoding': 'chunked' }
    */
    } else if (! r.headers.location ||
        r.headers.location.indexOf('https://oauth.live.com/authorize') !== 0) {
      if (debug) console.log('r.headers location was wrong...location=', r.headers.location);
      cleanup(user);

      cb("hotmail.com address should be redirected to hotmail accounts");
    } else {
        returnFromHotmail(user, cfg, cb);
    }
  });
} // startAuth

// Authentication 2
function returnFromHotmail (user, cfg, cb) {
  var url = '/auth/windowslive/callback';
  if (debug) console.log('=========Doing return from hotmail-----------');
  // So what is our problem??? Missing cookies or some state or something
  // 1441ea3a-da75-424c-6a66-52f19f4857ad
  user.request.get({
    url: client.url(url, cfg),
    qs: {
      'code': 'e25287dd-adb8-084a-36b3-a0b13501819e'
    },
    followRedirect: false
  }, function (err, r, body) {
    if (debug) console.log('Got response from /auth/windowslive/callback err=', err, 'body=', body);
    // TODO we get 'Invalid state, missing redirection url in session' so we must need
    // to setup some session state...

    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 200) {

      // cb("returnFromHotmail Expected 200 but got " + r.statusCode);
    } else {
      // TODO: we never get here, since Auth is busted
      startProvision(user, cfg, cb);
    }
  });
}

if (require.main === module) {
  var debug = true;
  userdb.addNewUser(userdb.getNewUser());

  exports.startFunc({base: 'https://127.0.0.1'}, function (err) {
    console.log('Finished');
  });
}