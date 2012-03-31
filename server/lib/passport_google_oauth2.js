/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    passport = require('passport');

var GOOGLE_CLIENT_ID = "49886215752.apps.googleusercontent.com"
var GOOGLE_CLIENT_SECRET = "Fvh-Nbqnux42ucgRh9dR0Lot";

passport.serializeUser(function(user, done) {
  console.log('passport.serializeUser user=', user);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log('passport.deserializeUser obj=', obj);
  done(null, obj);
});

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://dev.bigtent.nutria.org:3030/auth/google/callback"
    //http://dev.bigtent.nutria.org:3030/oauth2callback
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    console.log('passport.use(new GoogleStrategy accessToken=', accessToken, 'refreshToken=', refreshToken,
      'profile=', profile);
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

exports.init = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());
}