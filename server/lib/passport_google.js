/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
config = require('./configuration'),
GoogleStrategy = require('passport-google').Strategy,
logger = require('./logging').logger,
passport = require('passport'),
session = require('./session_context'),
statsd = require('./statsd'),
util = require('util');

const RETURN_PATH = '/auth/google/return';

var
baseUrl = util.format("https://%s", config.get('issuer')),
return_url = util.format("%s%s", baseUrl, RETURN_PATH),
realm = util.format("%s/", baseUrl);

// Google strategy requires these, but Yahoo and Hotmail works w/o serializers...
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Register the GoogleStrategy with Passport.
passport.use(new GoogleStrategy({
    returnURL: return_url,
    realm: realm
  },
  function(identifier, profile, done) {
    done(null, profile);
  }
));

exports.init = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
};

exports.views = function (app) {
  // /auth/google/return
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get(RETURN_PATH, passport.authenticate('google', { failureRedirect: '/cancel' }),
    function(req, res) {
      // Are we who we said we are?
      // Question - What is the right way to handle a@gmail.com as input, but b@gmail.com as output?
      var start = new Date(),
          metric = 'routes.auth.google.return',
          match = false;

      statsd.increment('routes.auth.google.return.get');

      if (req.user && req.user.emails) {
        req.user.emails.forEach(function (email_obj, i) {
          if (match) { return; }

          if (! email_obj.value) {
            statsd.increment('warn.routes.auth.google.return.no_email_value');
            logger.warn("Google should have had list of emails with a value property on each " + email_obj);
            return;
          }
          var email = email_obj.value;

          logger.debug((typeof email), email);
          if (email.toLowerCase() === session.getClaimedEmail(req).toLowerCase()) {
            statsd.increment('routes.auth.google.return.email_matched');
            var redirect_url = session.getBidUrl(baseUrl, req);
            match = true;

            session.clearClaimedEmail(req);
            session.clearBidUrl(req);

            session.setCurrentUser(req, email);
            res.redirect(redirect_url);
            statsd.timing(metric, new Date() - start);
            return;
          }
        });// forEach emails
      } else {
        statsd.increment('warn.routes.auth.google.return.no_emails');
        logger.warn("Google should have had user and user.emails" + req.user);
        res.redirect(session.getErrorUrl(baseUrl, req));
        statsd.timing(metric, new Date() - start);
      }
      if (!match) {
        statsd.increment('error.routes.auth.google.return.no_emails_matched');
        logger.error('No email matched...');
        res.redirect(session.getMismatchUrl(baseUrl, req));
        statsd.timing(metric, new Date() - start);
      }
  });
};
