/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./configuration'),
logger = require('./logging').logger,
Sekrit = require('./sekrit'),
session = require('./session_context');

var sekrit = new Sekrit({ secret: config.get('account_link_token').secret });

/**
 * Validates user session and creates secret token
 * for linking accounts.
 *
 * cb is function(err, token)
 */
exports.generateSecret = function(req, res, cb) {
  var claim = session.getClaimedEmail(req);
  var mismatch = session.getMismatchEmail(req);
  if (!claim || !mismatch) {
    return cb(new Error("Session is missing claimed, mismatched email, or both"));
  }
  sekrit.createAccountLink(claim, mismatch, function(err, secret) {
    if (err) {
      cb(err);
    } else {
      cb(null, claim, mismatch, secret);
    }
  });
};

/**
 * cb is function(err, emails)
 * emails will be a list of 2 emails, claimed and mismatched
 */
exports.validateSecret = function(req, res, secret, cb) {
  sekrit.checkAccountLink(secret, cb);
};

/*
 * A user may have multiple account linkages. This happens
 * when their mental model of their email address doesn't
 * match the Identity provider's model. The user can go
 * through an error flow, prove ownership of both addresses
 * and then setup a link. We store this link in a long
 * lived secure cookie.
 */
exports.recordLink = function(claimEmail, mismatchEmail, req) {
  var cEmail = claimEmail.toLowerCase(),
      mEmail = mismatchEmail.toLowerCase();

  if (cEmail === mEmail)
    throw new Error("Unable to link the same email address to itself");

  var lExists = module.exports.validateLinkage(claimEmail, mismatchEmail, req);

  if (false === lExists) {
    var links = module.exports.getAllLinks(req);
    links.push([claimEmail, mismatchEmail]);
    req.accountdb.links = JSON.stringify(links);
  }
};

/*
 * Checks user's account linking cookie for a valid link
 * between a claimed and mismatched identity.
 */
exports.validateLinkage = function(claimEmail, mismatchEmail, req) {
  var cEmail = claimEmail.toLowerCase(),
      mEmail = mismatchEmail.toLowerCase();

  var links = module.exports.getAllLinks(req);

  for (var i=0; i < links.length; i++) {
    if (cEmail === links[i][0] &&
        mEmail === links[i][1]) {
      return true;
    }
  }
  return false;
};

exports.getAllLinks = function(req) {
  var links = [];

  if (req.accountdb && req.accountdb.links) {
    try {
      links = JSON.parse(req.accountdb.links);
    } catch (e) { return false; }
  }
  return links;
};
