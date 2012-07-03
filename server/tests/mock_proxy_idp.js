#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');

// ./server is our current working directory
process.chdir(path.dirname(__dirname));

const
assoc_sess = require('./lib/mock_proxy_ip/assoc_session'),
config = require('../lib/configuration'),
express = require('express'),
fs = require('fs'),
url = require('url'),
util = require('util'),
logger = require('../lib/logging').logger;

var app, apps;

// We'll listen for http and https traffic.
http_app = express.createServer();

try {
  var privateKey = fs.readFileSync('config/privatekey.pem').toString();
  var certificate = fs.readFileSync('config/certificate.pem').toString();
  https_app = express.createServer({key: privateKey, cert: certificate});
} catch (e) {
  logger.error('You must setup config/privatekey.pem and config/certificate.pem');
  logger.error('See docs/DEV_NOTES.md for details.');
  throw e;
}

[http_app, https_app].forEach(function (app) {
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.logger());

  app.set('views', __dirname + '/lib/mock_proxy_ip/views');
  app.set('view engine', 'ejs');
  app.set('view options', {
    layout: false
  });

  app.use(function (req, resp, next) {
    var parts = url.parse(req.path.substring(1), true);
    req.url = parts.path;
    next();
  });

  // Google (bare request as well as one with query string)
  app.get('/accounts/o8/id', function (req, res) {
    res.header('Content-Type', 'application/xrds+xml');

    // Request #2 with query string
    if (req.query.id === 'AItOawnGECMktY2XvE8OVvDYev69a3BuCIPt00E') {
      // Response takes between 0 and 1.5 seconds
      var timeout = 100; // TODO Math.round(Math.random() * 1500);
      setTimeout(function () {
        res.render('accounts_o8_id_query.xrd.ejs');
      }, timeout);
    // request #1
    } else {
      res.render('accounts_o8_id.xrd.ejs');
    }
  });

  // Google request #3
  // Bug - we're not calculating the signature dynamically
  app.post('/accounts/o8/ud', function (req, res) {
    var dhConsumerPublic = req.body['openid.dh_consumer_public'].trim();
    // dh_server_public - Our dynamic public key
    // TODO console.log('Calling assoc_sess ', assoc_sess.associate_session(dhConsumerPublic));

    setTimeout(function () {
      res.contentType('text/plain');
      res.render('accounts_o8_ud.txt.ejs');
    }, 100); // TODO Math.round(Math.random() * 5000));
  });

});

http_app.listen(8442);
https_app.listen(8443);

console.log('Listening on 8442 and 8443 for google, yahoo, and hotmail traffic.');