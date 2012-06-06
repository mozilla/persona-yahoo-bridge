/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
WindowsLiveStrategy = require('passport-windowslive').Strategy,
config = require('./configuration'),
logger = require('./logging').logger,
passport = require('passport'),
session = require('./session_context'),
statsd = require('./statsd'),
util = require('util');

const CALLBACK_PATH = '/auth/windowslive/callback';

var
liveConfig = config.get('windows_live'),
protocol = config.get('use_https') ? 'https' : 'http',
hostname = util.format("%s://%s", protocol, config.get('issuer')),
returnURL = util.format("%s%s", hostname, CALLBACK_PATH);

// Register the WindowsLiveStrategy with Passport
passport.use(new WindowsLiveStrategy({
    clientID: liveConfig.client_id,
    clientSecret: liveConfig.client_secret,
    callbackURL: returnURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile._json);
  })
);

exports.init = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
};

exports.views = function(app) {
  // GET /auth/windowslive/callback
  // Use passport.authenticate() as route middleware to authenticate the
  // request. If authentication fails, the user will be redirected to an error
  // page. Otherwise, the primary route function function will be called.
  app.get(CALLBACK_PATH,
    passport.authenticate('windowslive', { failureRedirect: '/cancel' }),
    function(req, res) {
      var
      start = new Date(),
      metric = 'routes.auth.windowslive.callback',
      match = false,
      claimedEmail = session.getClaimedEmail(req),
      email,
      emailType;

      statsd.increment('routes.auth.windowslive.callback.get');

      if (req.user && req.user.emails) {
        for (emailType in req.user.emails) {
          if (!match && req.user.emails.hasOwnProperty(emailType)) {
            email = req.user.emails[emailType];
            if (email && email.toLowerCase() === claimedEmail.toLowerCase()) {
              match = true;
              statsd.increment('routes.auth.windowslive.callback.email_matched');
              session.clearClaimedEmail(req);
              session.setCurrentUser(req, email);
              res.redirect(session.getBidUrl(req));
              statsd.timing(metric, new Date() - start);
            }
          }
        }
      } else {
        statsd.increment('warn.routes.auth.windowslive.callback.no_emails');
        logger.warn('Windows Live should have user and user.emails' + req.user);
        res.redirect(session.getErrorUrl(req));
      }

      if (!match) {
        statsd.increment('warn.routes.auth.windowslive.callback.no_emails_matched');
        logger.error('No email matched...');
        res.redirect(session.getErrorUrl(req));
        statsd.timing(metric, new Date() - start);
      }
    }
  );
};
