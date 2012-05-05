/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./lib/configuration'),
      crypto = require('./lib/crypto.js'),
      logger = require('./lib/logging').logger,
      passport = require('passport'),
      proxy = require('./lib/idp_proxy');

exports.init = function (app) {
    var well_known_last_mod = new Date().getTime();

    app.get('/proxy/:email', function(req, res, next){

      // BrowserID puts some state in the URL which authentication_api.js depends on
      // Store this in the session and restore it during redirects, etc.
      req.session.bid_state = req.query;
      // TODO validate email with a util.validate_email liberated fn

      // TODO multiple strategies
      // https://gist.github.com/1732068
      var service = proxy.service(req.params.email);
      req.session.claim = req.params.email;
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
      if (req.session && req.session.email) {
        ctx.current_user = req.session.email;
        logger.info("Setting current user" + ctx.current_user);
      } else {
        logger.info("No active session");
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
      logger.info('provisioning key', req.body.pubkey);
      if (!req.session || !req.session.email) {
        res.writeHead(401);
        return res.end();
      }
      if (!req.body.pubkey || !req.body.duration) {
        res.writeHead(400);
        return res.end();
      }

      crypto.cert_key(
        req.body.pubkey,
        req.session.email,
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
        email: null,
        layout: false
      };
      if (req.isAuthenticated()) {
        if (req.session.email) {
          ctx.email = req.session.email;
        } else {
          logger.error("GET provision ERROR - req is authenticated, but no email in session");
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
        res.render('home', {
          email: req.user,
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
      logger.info(req.headers);
      if (req.headers['if-modified-since'] !== undefined) {
        var since = new Date(req.headers['if-modified-since']);
        if (isNaN(since.getTime())) {
          logger.error('======== Bad date in If-Modified-Since header');
        } else {
          util.puts(since);
          //TODO these are both true...
          logger.info('========= since', '>', since, (well_known_last_mod < since), ' and < ', (since < well_known_last_mod));
          logger.info('since==', since, 'well-known', new Date(well_known_last_mod));
          // Does the client already have the latest copy?
          if (since >= well_known_last_mod) {
            logger.info('Use the Cache, luke');
            // TODO move above?
            res.setHeader('Cache-Control', 'max-age=' + timeout);
            return res.send(304);
          } else {
            logger.info('=============== NO 304 FOR YOU =============');
          }
        }
      }
      // On startup, keys need to be pulled from memcache or some such
      var pk = JSON.stringify(crypto.pubKey);
      logger.info('======= CACHE HEADERS ========');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'max-age=' + timeout);
      res.setHeader('Last-Modified', new Date(well_known_last_mod).toUTCString());
      res.render('well_known_browserid', {
        public_key: pk,
        layout: false
      });
    });
};