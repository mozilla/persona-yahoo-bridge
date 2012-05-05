/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./lib/configuration'),
      crypto = require('./lib/crypto.js'),
      logger = require('./lib/logging').logger,
      passport = require('passport'),
      proxy = require('./lib/idp_proxy'),
      session = require('./lib/session_context');

exports.init = function (app) {
    var well_known_last_mod = new Date().getTime();

    app.get('/proxy/:email', function(req, res, next){

      session.initialBidUrl(req);

      // TODO validate email with a util.validate_email liberated fn

      var service = proxy.service(req.params.email);
      session.setClaimedEmail(req);

      // Abusing middleware like a function?
      // TODO stuff these is an associative array by service
      if (service == 'gmail.com') {
        (passport.authenticate('google', function(err, user, info) {
          if (err) {
            logger.error('ERROR:' + err);
          }
           logger.info('/proxy/:email auth/google/return callback user=' + user + ' info=' + info);
        }))(req, res, next); // passport.authenticate
      } else if (service == 'yahoo.com') {
        (passport.authenticate('yahoo', function(err, user, info) {
          if (err) {
            logger.error('ERROR:' + err);
          }
         logger.info('/proxy/:email auth/yahoo/return callback');
        }))(req, res, next); // passport.authenticate
      } else if (service == 'hotmail.com') {
        (passport.authenticate('hotmail', function(err, user, info) {
         logger.info('/proxy/:email auth/hotmail/return callback');
        }))(req, res, next); // passport.authenticate
      }
    });

    // Call back urls are in each service library (passport_google, etc)
    // Then if all goes well
    app.get('/sign_in', function (req, res) {
      var ctx = {
          layout: false,
          browserid_server: config.get('browserid_server'),
          current_user: null
        };
      var current = session.getCurrentUser(req);
      if (current) {
        ctx.current_user = current;
      } else {
        logger.debug("No active session");
      }
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
      var current_user = session.getCurrentUser(req),
          authed_email = req.body.authed_email;

      if (! current_user) {
        res.writeHead(401);
        return res.end();
      }

      if (!req.body.pubkey || !req.body.duration) {
        res.writeHead(400);
        return res.end();
      }

      // If user doesn't go through OpenID / OAuth flow, they maybe switching
      // from another active email
      if (authed_email !== current_user) {
        var active_emails = session.getActiveEmails(req);
        if (active_emails[authed_email] === true) {
          logger.debug('User has switched current email from ' + current_user + 'to ' + authed_email);
          current_user = authed_email;
          session.setCurrentUser(req, authed_email);
        }
      }

      crypto.cert_key(
        req.body.pubkey,
        current_user,
        req.body.duration,
        function(err, cert) {
          if (err) {
            res.writeHead(500);
            res.end();
          } else {
            res.json({ cert: cert });
          }
        });
    });

    app.get('/provision.js', function(req, res){
      // TODO
      // Dynamic JavaScript will allow us to support CSP
      res.contentType('js');
      var ctx = {
        emails: [],
        num_emails: 0,
        layout: false
      };
      if (req.isAuthenticated()) {
          ctx.emails = session.getActiveEmails(req);
          ctx.num_emails = Object.keys(ctx.emails).length;
      }
      res.render('provision_js', ctx);
    });

    // Useful for dev/test
    app.get('/', function(req, res){
        req.user = session.getCurrentUser(req);
        if (req.user === null) {
            req.user = "None";
        }
        var active = Object.keys(session.getActiveEmails(req));

        res.render('home', {
          current: req.user,
          active_emails: active,
          browserid_server: config.get('browserid_server')
        } );
    });

    app.get('/logout', function(req, res){
      req.session.reset();
      req.logout(); // passportism
      res.redirect('/');
    });
    app.get('/.well-known/browserid', function (req, res) {
      // 6 hours in seconds
      var timeout = 120 ; //6 * 60 * 60; // in seconds

      if (req.headers['if-modified-since'] !== undefined) {
        var since = new Date(req.headers['if-modified-since']);
        if (isNaN(since.getTime())) {
          logger.error('======== Bad date in If-Modified-Since header');
        } else {
          util.puts(since);
          // Does the client already have the latest copy?
          if (since >= well_known_last_mod) {
            // TODO move above?
            res.setHeader('Cache-Control', 'max-age=' + timeout);
            return res.send(304);
          }
        }
      }
      // On startup, keys need to be pulled from memcache or some such
      var pk = JSON.stringify(crypto.pubKey);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'max-age=' + timeout);
      res.setHeader('Last-Modified', new Date(well_known_last_mod).toUTCString());
      res.render('well_known_browserid', {
        public_key: pk,
        layout: false
      });
    });
};