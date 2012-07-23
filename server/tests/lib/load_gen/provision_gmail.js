/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint esnext:true */

/* This file is the "provision" activity, which simulates the process of a
 * user with an active session adding a new email with browserid. */

 // TODO: move out of this branch, yahoo only

const
certifier = require('../../../lib/certifier'),
client = require('../client'),
config = require('../../../lib/configuration'),
crypto = require('../../../lib/crypto'),
request = require('request'),
userdb = require('loady').userdb,
winston = require('winston');

// Once ever two weeks, our session has expired
exports.probability = (8 / 40.0);

var debug = false;

function cleanup(user) {
  userdb.releaseUser(user);
}

exports.startFunc = function (cfg, cb) {
  var user = userdb.getExistingUser();
  if (!user) {
    winston.warn("can't achieve desired concurrency!  not enough users!");
    return cb("not enough users");
  }
  // Provision, no session
  userdb.clearCookies(user);
  startProvision(user, cfg, cb);
};

// Provisioning, can handle active or no session
function startProvision (user, cfg, cb) {
  user.request.get({
    url: client.url('/provision', cfg)
  }, function (err, r, body) {
    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 200) {
      cleanup(user);
      cb("Expected /provision to be a 200, but was " + r.statusCode);
    } else {
      // TODO do we need csrf?
      var csrf = body;
      user.request.get({
        url: client.url('/provision.js', cfg)
      }, function (err, r, body) {
        // Do we have an active session?
        if (body.indexOf('provision([], 0);') !== -1) {
          if (debug) console.log('We have no session');
          startAuth(user, cfg, cb);
        } else {
          if (debug) console.log('We have an active session, done');
          cleanup(user);
          cb(null);
        }
      });
    }
  });
} // startProvision

// Authentication 1
function startAuth (user, cfg, cb) {
  var the_url = client.url('/proxy/' + encodeURIComponent('alice@gmail.com'), cfg);
  user.request.get({
    url: the_url,
    followRedirect: false
  }, function (err, r, body) {
    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 302) {
      cleanup(user);
      cb("Expected redirect status code, but got " + r.statusCode);
    } else if (! r.headers.location ||
        r.headers.location.indexOf('https://www.google.com/accounts/o8/ud') !== 0) {
      cleanup(user);

      cb("gmail.com address should be redirected to google accounts");
    } else {
        // location: 'https://www.google.com/accounts/o8/ud?openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.ns.sreg=http%3A%2F%2Fopenid.net%2Fextensions%2Fsreg%2F1.1&openid.sreg.optional=nickname%2Cemail%2Cfullname%2Cdob%2Cgender%2Cpostcode%2Ccountry%2Clanguage%2Ctimezone&openid.ns.ax=http%3A%2F%2Fopenid.net%2Fsrv%2Fax%2F1.0&openid.ax.mode=fetch_request&openid.ax.type.firstname=http%3A%2F%2Faxschema.org%2FnamePerson%2Ffirst&openid.ax.type.lastname=http%3A%2F%2Faxschema.org%2FnamePerson%2Flast&openid.ax.type.email=http%3A%2F%2Faxschema.org%2Fcontact%2Femail&openid.ax.required=firstname%2Clastname%2Cemail&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=AMlYA9X9Qi_qD-kigFFNsMeQsiTZALBk1v7n8Gd4DZtHq3Dy4o4spIyGIK2ILIFY3fwNAZeS&openid.return_to=https%3A%2F%2Fdev.bigtent.mozilla.org%2Fauth%2Fgoogle%2Freturn&openid.realm=https%3A%2F%2Fdev.bigtent.mozilla.org%2F',
        returnFromGoogle(user, cfg, cb);

    }
  });
} // startAuth

// Authentication 2
function returnFromGoogle (user, cfg, cb) {
  var url = '/auth/google/return';
  user.request.get({
    url: client.url(url, cfg),
    qs: {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'id_res',
        'openid.op_endpoint': 'https://www.google.com/accounts/o8/ud',
        'openid.response_nonce': '2012-06-08T04:22:44ZcmL31e_sBa8SJw',
        'openid.return_to': 'https://dev.bigtent.mozilla.org/auth/google/return',
        'openid.assoc_handle': 'AMlYA9Vqz-84CFi-ySMEtGpFZwR0LtjxwPN0Ic3Yq0Y_HXg84nkEN8YGr6oyDkJYQkgdxlE0',
        'openid.signed': 'op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle,ns.ext1,ext1.mode,ext1.type.firstname,ext1.value.firstname,ext1.type.email,ext1.value.email,ext1.type.lastname,ext1.value.lastname',
        'openid.sig': 'A5yhetCJ8sKiz6BKEUkwCKWWKadL/nEgNXO06jzqbqE=',
        'openid.identity': 'https://www.google.com/accounts/o8/id?id=AItOawnGECMktY2XvE8OVvDYev69a3BuCIPt00E',
        'openid.claimed_id': 'https://www.google.com/accounts/o8/id?id=AItOawnGECMktY2XvE8OVvDYev69a3BuCIPt00E',
        'openid.ns.ext1': 'http://openid.net/srv/ax/1.0',
        'openid.ext1.mode': 'fetch_response',
        'openid.ext1.type.firstname': 'http://axschema.org/namePerson/first',
        'openid.ext1.value.firstname': 'Austin',
        'openid.ext1.type.email': 'http://axschema.org/contact/email',
        'openid.ext1.value.email': 'austin.ok@gmail.com',
        'openid.ext1.type.lastname': 'http://axschema.org/namePerson/last',
        'openid.ext1.value.lastname': 'King HTTP/1.1'
    }
  }, function (err, r, body) {
    if (err) {
      cleanup(user);
      cb(err);
    } else if (r.statusCode !== 200) {
      // TODO: Mock OpenID doesn't generate the right signature, so this is busted...
      // Fake a session
      var clientSessions = require('client-sessions'),
      express = require('express'),
      LocalStrategy = require('passport-local').Strategy, // TODO npm install passport-local
      passport = require('passport'),
      sess_config = config.get('client_sessions'),
      session_context = require('../../../lib/session_context'),
      tobi = require('tobi');

      // BEGIN Broken Tobi/Passport code
      // This doeesn't work :(
      passport.serializeUser(function(user, done) {
        if (debug) console.log('serializeUser', user, done);
        done(null, user);
      });

      passport.deserializeUser(function(id, done) {
        if (debug) console.log('deserializeUser', id, done);
          done(err, id);
      });

      if (debug) console.log('imports done');

      var app = express.createServer();
      app.use(clientSessions({
        cookieName: sess_config.cookie_name,
        secret:     sess_config.secret,
        duration:   sess_config.duration
      }));
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(app.router);

      // Make our req.isAuthenticated return true
      passport.use(new LocalStrategy(
        function(username, password, done) {
          if (debug) console.log("Passport localSTraget");
          return done(null, {email: 'austin.ok@gmail.com'});
        }
      ));

      app.get('/', function (req, res) {
        if (debug) console.log('redirected.');
        res.send('ok');
      });

      // It would be great if we could run through session code,
      // then extract the cookie and use it for the real load
      // requests...
      app.get('/fake-session', function (req, res, next) {
        session_context.setCurrentUser(req, 'austin.ok@gmail.com');
        req.session.passport = {
          user: {displayName: 'Austin King',
          emails: ['austin.ok@gmail.com'],
          name: {}}};

        passport.authenticate('local', function (err, user, info) {
          /* TODO Commeted out because of serialization errors
          req.logIn(user, function(err) {
            console.log('all good=', err);
            if (err) { return next(err); }
          });
        */
        return res.send('ok');
        })(req, res, next);
      });

      var browser = tobi.createBrowser(app);

      browser.get('/fake-session', function (res, $) {
        user.request = request.defaults({jar: browser.cookieJar});
        /* TODO: We'd harvest or new cookies into user.request
        browser.cookieJar.cookies.forEach(function (cookie) {
          console.log("Adding " + cookie.str + " to jar");

          user.request.jar().add(user.request.cookie(cookie.str));
        });
        */

      // END Broken Tobi/Passport code

        // No session, so we can't startProvisioning again...
        //startProvision(user, cfg, cb);
        // Workaround for Tobi/Passport - Fake provisioning by using the certifier directly
        certifier(JSON.stringify(crypto.pubKey),
                  'alice@gmail.com',
                  60 * 60 * 6,
                  function (err, body) {
          if (debug) console.log('Cleaning up ');
          cleanup(user);
          cb(err);
        });
      });

      // cb("returnFromGoogle Expected 200 but got " + r.statusCode);
    } else {
      // TODO: we never get here, since Auth is busted
      startProvision(user, cfg, cb);
    }
  });
}

if (require.main === module) {
  var debug = true;
  userdb.addNewUser(userdb.getNewUser());

  exports.startFunc({base: 'https://127.0.0.1'}, function (err) {
    console.log('Finished');
  });
}