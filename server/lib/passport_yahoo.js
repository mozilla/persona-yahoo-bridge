/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var config = require('../lib/configuration'),
    YahooStrategy = require('passport-yahoo').Strategy,
    logger = require('./logging').logger,
    passport = require('passport'),
    util = require('util');

var protocol = 'http';
if (config.get('use_https')) {
  protocol = 'https';
}
var sessions,
    hostname = util.format("%s://%s", protocol, config.get('issuer')),
    return_url = util.format("%s/auth/yahoo/return", hostname),
    realm = util.format("%s/", hostname);


logger.debug('hostname', hostname);
logger.debug('return_url', return_url);
logger.debug('realm', realm);

// TODO when do these get called? Can we axe them if we don't have server side store
passport.serializeUser(function(user, done) {
  logger.debug('passport.serializeUser user=', user);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  logger.debug('passport.deserializeUser obj=', obj);
  done(null, obj);
});

// Use the YahooStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new YahooStrategy({
    returnURL: return_url,
    realm: realm
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    logger.debug('passport.use(new YahooStrategy identifier=', identifier, 'profile=', profile);
    process.nextTick(function () {

      // To keep the example simple, the user's Yahoo profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Yahoo account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

exports.init = function (app, clientSessions) {
  app.use(passport.initialize());
  app.use(passport.session());
  sessions = clientSessions;
}

exports.views = function (app) {
  // GET /auth/yahoo
  app.get('/auth/yahoo', function (req, res, next) {
      // TODO we'll have a route like
      // /proxy/:email which BID will send us too. Then we'll
      // look at the domain name and dispatch to the correct authentication
      req.session.claim = 'eozten@yahoo.com';
      next();
    },
    passport.authenticate('yahoo', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  // GET /auth/yahoo/return
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/yahoo/return',
    passport.authenticate('yahoo', { failureRedirect: '/login' }),
    function(req, res) {
      logger.debug('/auth/yahoo/return callback');
      // Are we who we said we are?
      // Question - What is the right way to handle a@gmail.com as input, but b@gmail.com as output?
      var match = false;
      if (req.user && req.user.emails) {
        req.user.emails.forEach(function (email_obj, i) {
          if (! email_obj.value) {
            logger.warn("Yahoo should have had list of emails with a value property on each " + email_obj);
          }
          var email = email_obj.value;
          if (! match) {
            logger.debug((typeof email), email);
            if (email.toLowerCase() === req.session.claim.toLowerCase()) {
              match = true;
              delete req.session.claim;
              req.session.email = email;
              // req.user.displayName
              // req.user.identifier - profile URL
            }
          }
        });
      } else {
        logger.warn("Yahoo should have had user and user.emails" + req.user);
      }
      logger.debug("hmmm do something sign_in like here...");
      res.redirect('/sign_in');
  });
}