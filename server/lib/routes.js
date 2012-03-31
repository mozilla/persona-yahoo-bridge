/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var passport = require('passport');

exports.init = function (app) {
    app.get('/', function(req, res){
        if (req.user === undefined) {
            req.user = {};
        }
        res.render('home', {user: req.user});
    });

    app.get('/account', ensureAuthenticated, function(req, res){
        res.render('account', { user: req.user });
    });

    app.get('/login', function(req, res){
      res.render('login', { user: req.user });
    });

    // GET /auth/google
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in Google authentication will involve redirecting
    //   the user to google.com.  After authenticating, Google will redirect the
    //   user back to this application at /auth/google/return
    app.get('/auth/google',
      passport.authenticate('google', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect('/');
      });

    // GET /auth/google/return
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get('/auth/google/return',
      passport.authenticate('google', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect('/');
      });

    app.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });
};

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}