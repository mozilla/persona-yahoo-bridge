/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./configuration'),
      WindowsLiveStrategy = require('passport-windowslive').Strategy,
      logger = require('./logging').logger,
      passport = require('passport'),
      session = require('./session_context'),
      statsd = require('./statsd'),
      util = require('util');

// TODO: Delete the registration for the testing app...
const RETURN_URL = '/auth/windowslive/callback';

var live_config = config.get('windows_live'),
    protocol = 'http';

if (config.get('use_https')) {
  protocol = 'https';
}

var hostname = util.format("%s://%s", protocol, config.get('issuer')),
    return_url = util.format("%s%s", hostname, RETURN_URL);

passport.use(new WindowsLiveStrategy({
    clientID: live_config['client_id'],
    clientSecret: live_config['client_secret'],
    callbackURL: RETURN_URL
  },
  function(accessToken, refreshToken, profile, done) {
    logger.debug('passport.use(new WindowsLiveStrategy profile=', profile);
    process.nextTick(function() {
      return done(null, profile._json);
    });
  }
));

exports.init = function(app, clientSessions) {
  app.use(passport.initialize());
  app.use(passport.session());
};

exports.views = function(app) {
  // GET /auth/windowslive/callback
  // Use passport.authenticate() as route middleware to authenticate the
  // request. If authentication fails, the user will be redirected to an error
  // page. Otherwise, the primary route function function will be called.
  app.get('/auth/windowslive/callback',
    passport.authenticate('windowslive', { failureRedirect: '/error' }),
    function(req, res) {
      var start = new Date(),
          metric = 'routes.auth.windowslive.callback',
          match = false,
          claimedEmail = session.getClaimedEmail(req),
          email,
          emailType;

      statsd.increment('routes.auth.windowslive.callback.get');

      // TODO: How should we handle the user authing as a different address than
      // we expect or want?
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
        return;
      }

      if (!match) {
        statsd.increment('warn.routes.auth.windowslive.callback.no_emails_matched');
        logger.error('No email matched...');
        res.redirect('/error');
        statsd.timing(metric, new Date() - start);
      }
    }
  );
};
