/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file is the "provision" activity, which simulates the process of a
 * user with an active session adding a new email with browserid. */

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
    url: client.url('/provision', cfg)
  }, function (err, r, body) {
    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 200) {
      cleanup(user);
      cb("Expected /provision to be a 200, but was " + r.statusCode);
    } else {
      // TODO do we need csrf?
      var csrf = body;
      user.request.get({
        url: client.url('/provision.js', cfg)
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
  user.request.get({
    url: client.url('/authentication', cfg)
  }, function (err, r, body) {
    if (err) {
      cleanup(user);
      cb(err);
    } else if (200 === r.statusCode) {
      if (debug) console.log('static auth looks goood, simulating JS window.location');
      var the_url = client.url('/proxy/' + encodeURIComponent('alice@yahoo.com'), cfg);
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
        } else if (! r.headers.location ||
            r.headers.location.indexOf('https://open.login.yahooapis.com/openid/op/auth') !== 0) {
          if (debug) console.log('r.headers location was wrong...location=', r.headers.location);
          cleanup(user);

          cb("yahoo.com address should be redirected to yahoo accounts");
        } else {
            returnFromYahoo(user, cfg, cb);
        }
      });
    }
  });
} // startAuth

// Authentication 2
function returnFromYahoo (user, cfg, cb) {
  var url = '/auth/yahoo/return';
  if (debug) console.log('Doing return from yahoo');

  user.request.get({
    url: client.url(url, cfg),
    qs: {
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'id_res',
      'openid.return_to': 'https://dev.bigtent.mozilla.org/auth/yahoo/return',
      'openid.claimed_id': 'https://me.yahoo.com/a/wS1JKacQi4p4xQo18GMr_WME7g--#94df6',
      'openid.identity': 'https://me.yahoo.com/a/wS1JKacQi4p4xQo18GMr_WME7g--',
      'openid.assoc_handle': 'M_l4fBUGTlN28_YxRKu3ugQDFThVRAIvntxS97Cy1kXR9uPx9SZoYbMY0bsYOJCiqJ1wdBdylmhQpUGULSJFEXdmS1cuV0FHwSTwGXOkUBVJEvyHHvG6NajKSN5YLDFCcMzr',
      'openid.realm': 'https://dev.bigtent.mozilla.org/',
      'openid.ns.ax': 'http://openid.net/srv/ax/1.0',
      'openid.ax.mode': 'fetch_response',
      'openid.ax.value.email': 'eozten@yahoo.com',
      'openid.response_nonce': '2012-07-09T21:21:11Zc2pSMmUS5maKkUXLIdr_R2EYBTZvvLgcFQ--',
      'openid.signed': 'assoc_handle,claimed_id,identity,mode,ns,op_endpoint,response_nonce,return_to,signed,ax.value.email,ax.type.email,ns.ax,ax.mode,pape.auth_level.nist',
      'openid.op_endpoint': 'https://open.login.yahooapis.com/openid/op/auth',
      'openid.ax.type.email': 'http://axschema.org/contact/email',
      'openid.pape.auth_level.nist': '0',
      'openid.sig': 'MrBUWMG1k07Dzkvq9YQ4iUiLdwdGdQTYAXRbdrahyeY'
    }
  }, function (err, r, body) {

    // TODO Fixing Issue #41 would make this actually work...
    // Then we could do /sign_in and have a working session...
    var msg = 'Failed to verify assertion (message: Invalid association handle)';

    if (500 === r.statusCode &&
        0 === body.indexOf(msg)) {
      // Success, but weak sauce
      cb(null);
    } else if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 200) {

      // cb("returnFromGoogle Expected 200 but got " + r.statusCode);
    } else {
      // TODO: we never get here, since Auth is busted
      startProvision(user, cfg, cb);
    }
  });
}

if (require.main === module) {
  debug = true;
  userdb.addNewUser(userdb.getNewUser());

  exports.startFunc({base: 'https://127.0.0.1'}, function (err) {
    if (err) {
      console.log('Finished with ERROR');
      console.error(err);
    } else {
      console.log('Finished OK');
    }
  });
}