/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
certify = require('./lib/certifier'),
config = require('./lib/configuration'),
crypto = require('./lib/crypto.js'),
logger = require('./lib/logging').logger,
passport = require('passport'),
request = require('request'),
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
  //   Dispatch the user to an appropriate authentication library.
  app.get('/proxy/:email', function(req, res, next) {
    var
    start = new Date(),
    domainInfo = config.get('domain_info');

    statsd.increment('routes.proxy.get');

    // Issue #18 - Verify user input for email
    if (valid_email(req.params.email) === false) {
      return res.send('Email is bad input', 400);
    }

    session.setClaimedEmail(req);

    // TODO: Can I define this somewhere closer to the strategy itself?
    var authOptions = {
      windowslive: { scope: 'wl.emails' }
    };

    var domain = req.params.email.split('@')[1];

    if (!domainInfo.hasOwnProperty(domain)) {
      logger.error('User landed on /proxy/:email for an unsupported domain');
      res.redirect(session.getErrorUrl(req));
    } else {
      var strategy = domainInfo[domain].strategy;

      if (strategy) {
        (passport.authenticate(strategy, authOptions[strategy]))(req,res,next);
      }
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

  var cryptoError = function (res, start) {
    statsd.increment('routes.provision.err.crypto');
    res.writeHead(500);
    res.end();
    statsd.timing('routes.provision_post', new Date() - start);
    return false;
  };

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
        return cryptoError(res, start);
      } else {
        try {
          var certResp = JSON.parse(cert);
          if (certResp && certResp.success) {
            // Kill Session Issue #62
            req.session.reset();
            res.json({ cert: certResp.certificate });
          } else {
            console.error('certifier expected success: true, but got ', cert);
            return cryptoError(res, start);
          }

	} catch (e) {
          console.error('Bad output from certifier');
          if (e.stack) console.error(e.stack);
          return cryptoError(res, start);
        }
      }
      statsd.timing('routes.provision_post', new Date() - start);
    };

    certify(req.body.pubkey,
            current_user,
            req.body.duration,
            certified_cb);
  });

  // GET /provision.js
  //   This script handles client-side provisioning logic.
  app.get('/provision.js', function(req, res) {
    var
    start = new Date(),
    ctx = {
      emails: [],
      num_emails: 0,
      layout: false
    };

    statsd.increment('routes.provision_js.get');

    console.log('============ /provision.js ', req.headers);
    console.log('req.isAuthenticated()', req.isAuthenticated());
    console.log(req.session);

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

    statsd.increment('routes.error.get');

    res.render('error', {
      browserid_server: config.get('browserid_server'),
      claimed: session.getClaimedEmail(req),
      layout: false
    });

    statsd.timing('routes.error', new Date() - start);
  });

  // GET /id_mismatch
  //   Error page for when a user auths as an email address other than the
  //   intended one. E.g., a user told BigTent that they were foo@yahoo.com, but
  //   we got back an OpenID auth for bar@yahoo.com.
  // TODO: Add load test activity
  app.get('/id_mismatch', function(req, res) {
    var
    start = new Date(),
    claimed = session.getClaimedEmail(req),
    domain = claimed.split('@')[1],
    domainInfo = config.get('domain_info');

    statsd.increment('routes.id_mismatch.get');

    if (!domainInfo.hasOwnProperty(domain)) {
      logger.error('User landed on /id_mismatch for an unsupported domain');
      res.redirect(session.getErrorUrl(req));
    } else {
      res.render('id_mismatch', {
        browserid_server: config.get('browserid_server'),
        claimed: claimed,
        provider: domainInfo[domain].providerName,
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

  // GET /.well-known/browserid
  //   Declare support as a BrowserID Identity Provider.
  app.get('/.well-known/browserid', function(req, res) {
    var
    start = new Date(),
    timeout = config.get('pub_key_ttl');

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

  app.get('/', function (req, res) {
      res.setHeader('X-Old-Man', 'You kids get off my lawn!');
      res.redirect('https://login.persona.org/');
  });

  // GET /__heartbeat__
  //   Report on whether or not this node is functioning as expected.
  app.get('/__heartbeat__', function(req, res) {
    var
    url = util.format('http://%s:%s/__heartbeat__',
                      config.get('certifier_host'),
                      config.get('certifier_port')),
    opts = {
      url: url,
      timeout: 500
    };
    request(url, function (err, heartResp, body) {
      if (err ||
          200 !== heartResp.statusCode ||
          'ok certifier' !== body.trim()) {
        res.writeHead(500);
        res.write('certifier down');
        res.end();
      } else {
        res.writeHead(200);
        res.write('ok');
        res.end();
      }
    });
  });
};
