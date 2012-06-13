/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
certify = require('./lib/certifier'),
config = require('./lib/configuration'),
crypto = require('./lib/crypto.js'),
logger = require('./lib/logging').logger,
passport = require('passport'),
statsd = require('./lib/statsd'),
session = require('./lib/session_context'),
util = require('util'),
valid_email = require('./lib/validation/email');

exports.init = function(app) {
  var well_known_last_mod = new Date().getTime();

  app.get('/authentication', function (req, res) {
    var start = new Date();
    statsd.increment('routes.authentication.get');

    session.initialBidUrl(req);
    res.render('authentication', {
      layout: false,
      browserid_server: config.get('browserid_server')
    });
    statsd.timing('routes.authentication', new Date() - start);
  });

  // GET /proxy/:email
  //   Dispatch the user to an appropriate authentication service library.
  app.get('/proxy/:email', function(req, res, next) {
    var start = new Date();
    statsd.increment('routes.proxy.get');


    // Issue #18 - Verify user input for email
    if (valid_email(req.params.email) === false) {
      return res.send('Email is bad input', 400);
    }

    session.setClaimedEmail(req);

    // NOTE: If modifying, also update the entry for /id_mismatch.
    // TODO: Move this into configuration?
    var strategies = {
      'gmail.com': 'google',
      'yahoo.com': 'yahoo',
      'hotmail.com': 'windowslive'
    };

    var authOptions = {
      windowslive: { scope: 'wl.emails' }
    };

    var service = req.params.email.split('@')[1];
    var strategy = strategies[service];

    if (strategy) {
      (passport.authenticate(strategy, authOptions[strategy]))(req,res,next);
    }

    statsd.timing('routes.proxy', new Date() - start);
  });

  // GET /sign_in
  //   After successful authentication double-check the email address and
  //   begin or abort BrowserID provisioning as appropriate.
  //
  //   Note that per-service callback URLs are defined in each service
  //   library (passport_google, etc); those callbacks redirect here if the
  //   user successfully auths with the service.
  app.get('/sign_in', function(req, res) {
    var
    start = new Date(),
    current = session.getCurrentUser(req),
    ctx = {
      layout: false,
      browserid_server: config.get('browserid_server'),
      current_user: current ? current : null
    };

    statsd.increment('routes.sign_in.get');

    if (!current) { logger.debug("No active session"); }

    res.render('signin', ctx);

    statsd.timing('routes.sign_in', new Date() - start);
  });

  // GET /provision
  //   Begin BrowserID provisioning.
  app.get('/provision', function(req, res){
    var
    start = new Date(),
    ctx = {
      layout: false,
      browserid_server: config.get('browserid_server')
    };

    statsd.increment('routes.provision.get');

    res.render('provision', ctx);

    statsd.timing('routes.provision', new Date() - start);
  });

  // POST /provision
  //   Finish BrowserID provisioning by signing a user's public key.
  app.post('/provision', function(req, res) {
    var
    start = new Date(),
    current_user = session.getCurrentUser(req),
    authed_email = req.body.authed_email;

    if (!current_user || ! req.isAuthenticated()) {
      res.writeHead(401);
      statsd.increment('routes.provision.no_current_user');
      return res.end();
    }

    if (!req.body.pubkey || !req.body.duration) {
      res.writeHead(400);
      statsd.increment('routes.provision.invalid_post');
      return res.end();
    }

    statsd.increment('routes.provision_get.post');

    // If user doesn't go through OpenID / OAuth flow, they may be switching
    // between already active emails.
    if (authed_email !== current_user) {
      var active_emails = session.getActiveEmails(req);
      if (active_emails[authed_email] === true) {
        logger.debug('User has switched current email from ' + current_user + 'to ' + authed_email);
        current_user = authed_email;
        session.setCurrentUser(req, authed_email);
        statsd.increment('routes.provision.email_flopped');
      }
    }

    var certified_cb = function(err, cert) {
      var user_cert = cert,
      certificate;

      if (crypto.chainedCert) {
        console.log('CHAINING CERTS');
        user_cert = util.format('%s~%s', crypto.chainedCert, cert);
      }
      if (err) {
        statsd.increment('routes.provision.err.crypto');
        res.writeHead(500);
        res.end();
      } else {
        certificate = JSON.parse(cert).certificate;
        res.json({ cert: certificate });
      }
      statsd.timing('routes.provision_post', new Date() - start);
    };

    certify(JSON.stringify(req.body.pubkey),
            current_user,
            req.body.duration,
            certified_cb);
  });

  // GET /provision.js
  //   This script handles client-side provisioning logic.
  //   TODO: Dynamic JavaScript will allow us to support CSP
  app.get('/provision.js', function(req, res) {
    var
    start = new Date(),
    ctx = {
      emails: [],
      num_emails: 0,
      layout: false
    };

    statsd.increment('routes.provision_js.get');

    if (req.isAuthenticated()) {
      ctx.emails = session.getActiveEmails(req);
      ctx.num_emails = Object.keys(ctx.emails).length;
    }

    res.contentType('js');
    res.render('provision_js', ctx);

    statsd.timing('routes.provision_js', new Date() - start);
  });

  // GET /error
  //   Generic error page for when we're unable to log a user in.
  app.get('/error', function(req, res) {
    var start = new Date();

    statsd.increment('routes.provision_js.get');

    res.render('error', {
      browserid_server: config.get('browserid_server'),
      claimed: session.getClaimedEmail(req),
      layout: false
    });

    statsd.timing('routes.error', new Date() - start);
  });

  // GET /id_mismatch
  //   Error page for when a user auths as an email address other than the
  //   intended one. E.g., a user told BigTent that they were foo@gmail.com, but
  //   we got back an OpenID auth for bar@gmail.com.
  app.get('/id_mismatch', function(req, res) {
    var
    start = new Date(),
    claimed = session.getClaimedEmail(req),
    domain = claimed.split('@')[1],
    domainInfo = {
      'gmail.com': {provider: 'Google', providerURL: 'https://gmail.com/'},
      'hotmail.com': {provider: 'Hotmail', providerURL: 'http://hotmail.com'},
      'yahoo.com': {provider: 'Yahoo', providerURL: 'https://mail.yahoo.com'}
    };

    // NOTE: If updating domainInfo, also update the entry for /proxy/:email
    // TODO: Move this into configuration?

    statsd.increment('routes.id_mismatch.get');

    if (!domainInfo.hasOwnProperty(domain)) {
      logger.error('User landed on /id_mismatch for an unsupported domain');
      res.redirect(session.getErrorUrl(req));
    } else {
      res.render('id_mismatch', {
        browserid_server: config.get('browserid_server'),
        claimed: claimed,
        provider: domainInfo[domain].provider,
        providerURL: domainInfo[domain].providerURL,
        layout: false
      });
    }

    statsd.timing('routes.id_mismatch', new Date() - start);
  });

  // GET /cancel
  //   Handle the user cancelling the OpenID or OAuth flow.
  app.get('/cancel', function(req, res) {
    res.redirect(session.getCancelledUrl(req));
  });

  // GET /cancelled
  //   If the user cancelled login, raise a BrowserID authentication
  //   failure, which instructs the user agent to return to its provisioning
  //   flow and proceed with its failure case. Typically, this just
  //   re-starts the BrowserID flow for the user.
  app.get('/cancelled', function(req, res) {
    var start = new Date();

    statsd.increment('routes.cancelled.get');

    res.render('cancelled', {
      browserid_server: config.get('browserid_server'),
      layout: false
    });

    statsd.timing('routes.cancelled', new Date() - start);
  });

  // GET /
  //   Render a page that allows for directly starting the proxy auth flow
  //   and managing BigTent-specific login state. This is only useful for
  //   development and testing.
  //
  //   TODO: Hide this behind a flag so it's disabled / behaves differently
  //   in production?
  app.get('/', function(req, res){
    var start = new Date();

    statsd.increment('routes.homepage.get');

    req.user = session.getCurrentUser(req);
    if (req.user === null) { req.user = "None"; }

    var active = Object.keys(session.getActiveEmails(req));

    res.render('home', {
      current: req.user,
      active_emails: active,
      browserid_server: config.get('browserid_server')
    });

    statsd.timing('routes.homepage', new Date() - start);
  });

  // GET /logout
  //   Clear the user's BigTent session. This is only used for development
  //   and testing.
  app.get('/logout', function(req, res){
    var start = new Date();

    statsd.increment('routes.logout.get');

    req.session.reset();
    req.logout(); // passportism
    res.redirect('/');

    statsd.timing('routes.homepage', new Date() - start);
  });

  // GET /.well-known/browserid
  //   Declare support as a BrowserID Identity Provider.
  app.get('/.well-known/browserid', function(req, res) {
    // 6 hours in seconds
    // FIXME: Actually 2 minutes. When do we change it?
    var
    start = new Date(),
    timeout = 120; //6 * 60 * 60; // in seconds

    statsd.increment('routes.wellknown.get');

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

    var pk = JSON.stringify(crypto.pubKey);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'max-age=' + timeout);
    res.setHeader('Last-Modified', new Date(well_known_last_mod).toUTCString());
    res.render('well_known_browserid', {
      public_key: pk,
      layout: false
    });

    statsd.timing('routes.wellknown', new Date() - start);
  });
};
