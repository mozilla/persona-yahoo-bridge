/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var GoogleStrategy = require('passport-google').Strategy,
    passport = require('passport');


passport.serializeUser(function(user, done) {
  console.log('passport.serializeUser user=', user);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log('passport.deserializeUser obj=', obj);
  done(null, obj);
});

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new GoogleStrategy({
    returnURL: 'http://192.168.186.138:3030/auth/google/return',
    realm: 'http://192.168.186.138:3030/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    console.log('passport.use(new GoogleStrategy identifier=', identifier, 'profile=', profile);
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

exports.init = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());
}