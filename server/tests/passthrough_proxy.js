#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var
fs = require('fs'),
httpProxy = require('http-proxy'),
http = require('http'),
https = require('https'),
path = require('path'),
url = require('url');

// ./server is our current working directory
process.chdir(path.dirname(__dirname));

console.log(process.cwd());

httpProxy.createServer(function (req, res, proxy) {
    console.log('url before', req.url);
    var parts = url.parse(req.url);
    console.log('url parts', parts);
    req.url = parts.path;
    console.log('url after', req.url);
    clearProxy(req.headers.host).proxyRequest(req, res);
}).listen(9080);

var options = {
  https: {
    key: fs.readFileSync('config/privatekey.pem', 'utf8'),
    cert: fs.readFileSync('config/certificate.pem', 'utf8')
  },
  target: {
    https: true
  }
};

var c_proxies = {};
var s_proxies = {};

function makeProxy (host, port) {
  return new httpProxy.HttpProxy({
    target: {
	host: host, 
	port: port,
        https: true
    }
  });
}

function clearProxy (hostname) {
    if (! c_proxies[hostname]) {
	console.log('Creating proxy for ', hostname);
	c_proxies[hostname] = makeProxy(hostname, 80);
    }
    return c_proxies[hostname];
}

function secureProxy (hostname) {
    if (! s_proxies[hostname]) {
	console.log('Creating secure proxy for ', hostname);
	s_proxies[hostname] = makeProxy(hostname, 443);
    }
    return s_proxies[hostname];
}

// 9443 https pass through
var s = https.createServer(options.https, function (req, res) {
    console.log('Host: ', req.headers.host);
    console.log(req.url);
    console.log(res._events);
    res.on('data', function (chunk) {
	console.log('ON DATA=', chunk.toString('utf8'));
    });
    res.on('end', function () {
	console.log('ON END=');
    });
    res.on('close', function () {
	console.log('ON CLOSE=');
    });

    console.log('url before', req.url);
    var parts = url.parse(req.url);
    console.log('url parts', parts);
    req.url = parts.path;
    console.log('url after', req.url);

    secureProxy(req.headers.host).proxyRequest(req, res);    
});
s.on('data', function (chunk) {
    console.log(chunk.toString('utf8'));
});
s.listen(9443);

