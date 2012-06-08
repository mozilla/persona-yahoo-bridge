#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');

// ./server is our current working directory
process.chdir(path.dirname(__dirname));

const
config = require('../lib/configuration'),
express = require('express'),
fs = require('fs'),
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

  // Google (bare request as well as one with query string)
  app.get('/accounts/o8/id', function (req, res) {
    res.header('Content-Type', 'application/xrds+xml');

    // Request #2 with query string
    if (req.query.id === 'AItOawnGECMktY2XvE8OVvDYev69a3BuCIPt00E') {
      res.send('<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)"> \
  <XRD>                                                                  \
  <Service priority="0">                                                 \
  <Type>http://specs.openid.net/auth/2.0/signon</Type>                   \
  <Type>http://openid.net/srv/ax/1.0</Type>                              \
  <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type>      \
  <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type>            \
  <Type>http://specs.openid.net/extensions/pape/1.0</Type>               \
  <URI>https://www.google.com/accounts/o8/ud</URI>                       \
  </Service>                                                             \
  <Service priority="10">                                                \
  <Type>http://specs.openid.net/auth/2.0/signon</Type>                   \
  <Type>http://openid.net/srv/ax/1.0</Type>                              \
  <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type>      \
  <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type>            \
  <Type>http://specs.openid.net/extensions/pape/1.0</Type>               \
  <URI>https://www.google.com/accounts/o8/ud?source=mail</URI>           \
  </Service>                                                             \
  <Service priority="10">                                                \
  <Type>http://specs.openid.net/auth/2.0/signon</Type>                   \
  <Type>http://openid.net/srv/ax/1.0</Type>                              \
  <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type>      \
  <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type>            \
  <Type>http://specs.openid.net/extensions/pape/1.0</Type>               \
  <URI>https://www.google.com/accounts/o8/ud?source=gmail.com</URI>      \
  </Service>                                                             \
  <Service priority="10">                                                \
  <Type>http://specs.openid.net/auth/2.0/signon</Type>                   \
  <Type>http://openid.net/srv/ax/1.0</Type>                              \
  <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type>      \
  <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type>            \
  <Type>http://specs.openid.net/extensions/pape/1.0</Type>               \
  <URI>https://www.google.com/accounts/o8/ud?source=googlemail.com</URI> \
  </Service>                                                             \
  <Service priority="10">                                                \
  <Type>http://specs.openid.net/auth/2.0/signon</Type>                   \
  <Type>http://openid.net/srv/ax/1.0</Type>                              \
  <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type>      \
  <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type>            \
  <Type>http://specs.openid.net/extensions/pape/1.0</Type>               \
  <URI>https://www.google.com/accounts/o8/ud?source=profiles</URI>       \
  </Service>                                                             \
  </XRD>                                                                 \
</xrds:XRDS>');

    // request #1
    } else {
    res.send('<?xml version="1.0" encoding="UTF-8"?>                \
<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)">    \
  <XRD>                                                             \
  <Service priority="0">                                            \
  <Type>http://specs.openid.net/auth/2.0/server</Type>              \
  <Type>http://openid.net/srv/ax/1.0</Type>                         \
  <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type> \
  <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type>       \
  <Type>http://specs.openid.net/extensions/pape/1.0</Type>          \
  <URI>https://www.google.com/accounts/o8/ud</URI>                  \
  </Service>                                                        \
  </XRD>                                                            \
</xrds:XRDS>');
    }
  });

  // Google request #3
  // Bug - we're not calculating the signature dynamically
  app.post('/accounts/o8/ud', function (req, res) {
    res.send('ns:http://specs.openid.net/auth/2.0\n\
session_type:DH-SHA256\n\
assoc_type:HMAC-SHA256\n\
assoc_handle:AMlYA9Vqz-84CFi-ySMEtGpFZwR0LtjxwPN0Ic3Yq0Y_HXg84nkEN8YGr6oyDkJYQkgdxlE0\n\
expires_in:468000\n\
dh_server_public:MmMuQSq7zIyl1wnHK+6UBFqX5MNOTJa8onC4UmX970SUu26HDkRPw/A7By+9BAb2/Dycqm01YVoJT7HdaGnjizplqRRrKeLuFiCuPyrM0Iw6gqYx96bmEF3mw9LuJ61Dgh8Hk9i3LhKodl2jyfNkz30HBdaERI/i3pbHIKdCcaQ=\n\
enc_mac_key:bablwarquqQclMcLvwjypZEFQ2CpeDPcvUvdl+AqUsU=');
  });
});

http_app.listen(8442);
https_app.listen(8443);

console.log('Listening on 8442 and 8443 for google, yahoo, and hotmail traffic.');