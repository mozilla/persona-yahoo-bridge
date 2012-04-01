/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var config = require('./lib/configuration'),
    crypto = require('./lib/crypto.js');
    passport = require('passport'),
    proxy = require('./lib/idp_proxy');

exports.init = function (app) {
    app.get('/proxy/:email', function(req, res, next){
      console.log("About to proxy email=", req.params.email);
      // TODO multiple strategies
      // https://gist.github.com/1732068
      var service = proxy.service(req.params.email);
      req.session.claim = req.params.email;
      // Abusing middleware like a function?
      // TODO stuff these is an associative array by service
      (passport.authenticate('google', function(err, user, info) {
         console.log('/proxy/:email auth/google/return callback');
      }))(req, res, next); // passport.authenticate
    });

    // Call back urls are in each service library (passport_google, etc)
    // Then if all goes well
    app.get('/sign_in', function (req, res) {
      var ctx = {
          layout: false,
          browserid_server: config.get('browserid_server')
        };
      res.render('signin', ctx);
    });
    app.get('/provision', function(req, res){
        var ctx = {
          layout: false,
          browserid_server: config.get('browserid_server')
        };
        res.render('provision', ctx);
    });

    app.post('/provision', function(req, res){
      console.log('provisioning key', req.body.pubkey);
      if (!req.session || !req.session.email) {
        resp.writeHead(401);
        return resp.end();
      }
      if (!req.body.pubkey || !req.body.duration) {
        resp.writeHead(400);
        return resp.end();
      }

      crypto.cert_key(
        req.body.pubkey,
        req.session.email,
        req.body.duration,
        function(err, cert) {
          if (err) {
            resp.writeHead(500);
            resp.end();
          } else {
            resp.json({ cert: cert });
          }
        });
    });

    app.get('/provision.js', function(req, res){
      // TODO
      // Dynamic JavaScript will allow us to support CSP
      res.contentType('js');
      var ctx = {
        email: null,
        layout: false
      };
      if (req.isAuthenticated()) {
        if (req.session.email) {
          ctx.email = req.session.email;
        } else {
          console.error("GET provision ERROR - req is authenticated, but no email in session");
        }
      }
      res.render('provision_js', ctx);
    });

    // Useful for dev/test
    app.get('/', function(req, res){
        req.user = req.session.email;
        if (req.user === undefined) {
            req.user = "None";
        }
        res.render('home', {email: req.user});
    });

    app.get('/logout', function(req, res){
      req.session.reset();
      req.logout(); // passportism
      res.redirect('/');
    });
};