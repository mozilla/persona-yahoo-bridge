/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const pinCode = require('./pin_code'),
config = require('../lib/configuration'),
YahooStrategy = require('passport-yahoo').Strategy,
logger = require('./logging').logger,
passport = require('passport'),
session = require('./session_context'),
statsd = require('./statsd'),
util = require('util');

const RETURN_PATH = '/auth/yahoo/return';

var
baseUrl = util.format("https://%s", config.get('issuer')),
return_url = util.format("%s%s", baseUrl, RETURN_PATH),
realm = util.format("%s/", baseUrl);

// Register the YahooStrategy with Passport.
var strategy = new YahooStrategy({
    returnURL: return_url,
    realm: realm,
    stateless: true
  },
  function(identifier, profile, done) {
    return done(null, profile);
  });

passport.use(strategy);

exports.init = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
};

exports.views = function(app) {
  // GET /auth/yahoo/return
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get(RETURN_PATH,
    passport.authenticate('yahoo', { failureRedirect: '/cancel' }),
    function(req, res) {
      // Are we who we said we are?
      var start = new Date(),
          metric = 'routes.auth.yahoo.return',
          match = false;

      statsd.increment('routes.auth.yahoo.return.get');

      // keep track of emails reported by yahoo for logging in case
      // of failure
      var openid_emails = [];

      if (req.user && req.user.emails) {
        var rawClaimedEmail = session.getClaimedEmail(req) || "";
        var claimedEmail = rawClaimedEmail.toLowerCase();
        req.user.emails.forEach(function(email_obj, i) {

          // add the email to the list of all emails reported by
          // yahoo for logging in case of failure
          openid_emails.push(email_obj.value);

          if (match) { return; }

          if (! email_obj.value) {
            statsd.increment('warn.routes.auth.yahoo.return.no_email_value');
            logger.warn("Yahoo should have had list of emails with a value property on each " + email_obj);
          }
          var email = email_obj.value.toLowerCase();
          if (! match) {
            if (email === claimedEmail || pinCode.wasValidated(claimedEmail, req)) {
              if (email === claimedEmail) {
                statsd.increment('routes.auth.yahoo.return.email_matched');
              } else {
                // With a previously PIN verified claimed email, it's okay to treat it
                // like the user's current email
                email = claimedEmail;
                statsd.increment('routes.auth.yahoo.return.emails_linked');
              }

              var redirect_url = session.getBidUrl(baseUrl, req);
              match = true;

              session.clearClaimedEmail(req);
              session.clearBidUrl(req);

              session.setCurrentUser(req, email);
              res.redirect(redirect_url);
              statsd.timing(metric, new Date() - start);
              return;
            }
          }
        }); //forEach emails
      } else {
        logger.warn("Yahoo should have had user and user.emails" + req.user);
        statsd.increment('warn.routes.auth.yahoo.return.no_emails');
        res.redirect(session.getErrorUrl(baseUrl, req));
        statsd.timing(metric, new Date() - start);
      }

      if (!match) {
        statsd.increment('warn.routes.auth.yahoo.return.no_emails_matched');
        logger.error('No email matched...');
        // We store these wrong email addresses (okay address... Yahoo only returns
        // one) under "mismatchedEmail". We will use this later to either:
        // * Inform the user there is an auth error a@yahoo.com versus b@yahoo.com
        // * Let the user do email verification loop for a@yahoo.com
        session.setMismatchEmail(openid_emails.join(", "), req);
        res.redirect(session.getMismatchUrl(baseUrl, req));
        statsd.timing(metric, new Date() - start);
      }

  });
};
