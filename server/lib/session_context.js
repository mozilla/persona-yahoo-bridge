/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
qs = require('qs'),
util = require('util');

/* Encapsulates session related features */


/* Bid URL - The URL that we start and finish on is important to
   BrowserID functioning properly */

// BrowserID puts some state in the URL which authentication_api.js depends on
// Store this in the session and restore it during redirects, etc.
// TODO @stomlinson suggested noting our initial URL and redirecting to that...
// https://github.com/mozilla/browserid/issues/1502
// Remove these once 1502 is fixed
exports.initialBidUrl = function (req) {
  req.session.bid_state = req.query;
};

exports.getBidUrl = function (req) {
  if (! req.session || ! req.session.bid_state) {
    throw "Invalid state, missing redirection url in session";
  }
  return util.format('/sign_in?%s', qs.stringify(req.session.bid_state));
};

exports.clearBidUrl = function (req) {
  if (req.session && req.session.bid_state) {
    delete req.session.bid_state;
  }
};

exports.getErrorUrl = function (req) {
  var err = '/error';
  if (! req.session || ! req.session.bid_state) {
    return err;
  }
  return util.format('%s?%s', err, qs.stringify(req.session.bid_state));
};

exports.getCancelledUrl = function (req) {
  var err = '/cancelled';
  if (! req.session || ! req.session.bid_state) {
    return err;
  }
  return util.format('%s?%s', err, qs.stringify(req.session.bid_state));
};

exports.getMismatchUrl = function (req) {
  var err = '/id_mismatch';
  if (! req.session || ! req.session.bid_state) {
    return err;
  }
  return util.format('%s?%s', err, qs.stringify(req.session.bid_state));
};

/*
 * During authentication, a user will enter a certain email adress
 * into the Persona dialog. The user is claiming to own that email
 * address. These functions will track that email for the user's
 * session.
 */

exports.setClaimedEmail = function (req) {
  req.session.claim = req.params.email;
};

exports.getClaimedEmail = function (req) {
  if (! req.session || ! req.session.claim) {
    return null;
  } else {
    return req.session.claim;
  }
};

exports.clearClaimedEmail = function (req) {
  if (req.session && req.session.claim) {
    delete req.session.claim;
  }
};

/* A User may use multiple email addresses. Although there
   is only one 'claimed email' which they are attempting to prove
   or one 'current email' which they are last authenticated into,
   we will keep track of all emails which were active during the
   session, so we can provision without having to re-do the OpenID/OAuth
   dance.
*/

exports.setCurrentUser = function (req, email) {
  req.session.current_email = email;
  if (! req.session.all_emails) {
    req.session.all_emails = {};
  }
  req.session.all_emails[email] = true;
};

exports.getCurrentUser = function (req) {
  if (! req.session || ! req.session.current_email) {
    return null;
  } else {
    return req.session.current_email;
  }
};

exports.getActiveEmails = function (req) {
  if (! req.session || ! req.session.all_emails) {
    return {};
  }
  return req.session.all_emails;
};
