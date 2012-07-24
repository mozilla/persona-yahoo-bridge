/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* client.js - HTTP client wrapper for testing BigTent Code
   Handles:
   * serverConfig
   * CSRF tokens
   * Cookie Jars
   * Simulating simultaneous sessions
*/

// TODO replace most of this with 'request' library.

const http = require('http'),
      https = require('https'),
      querystring = require('querystring');
      url = require('url'),
      util = require('util'),
      winston = require('winston');

exports.url = function (path, serverConfig) {
  if (! serverConfig.base) {
    throw "Expected serverConfig to have a base property with prootcol and domain name.";
  } else if (serverConfig.base.slice(-1) === '/') {
    throw "Expected serverConfig.base to be a protocol and domain name.";
  } else if (path.charAt(0) !== '/') {
    throw "Path must be a relative url";
  }
  return util.format('%s%s', serverConfig.base, path);
};

// Low level functions origionally from mozilla/browserid/lib/wsapi_client.js
function injectCookies(ctx, headers) {
  if (ctx.cookieJar && Object.keys(ctx.cookieJar).length) {
    headers['Cookie'] = "";
    for (var k in ctx.cookieJar) {
      headers['Cookie'] += k + "=" + ctx.cookieJar[k];
    }
  }
}

function extractCookies(ctx, res) {
  if (ctx.cookieJar === undefined) ctx.cookieJar = {};
  if (res.headers['set-cookie']) {
    res.headers['set-cookie'].forEach(function(cookie) {
      var m = /^([^;]+)(?:;.*)$/.exec(cookie);
      if (m) {
        var x = m[1].split('=');
        ctx.cookieJar[x[0]] = x[1];
      }
    });
  }
}

exports.clearCookies = function(ctx) {
  if (ctx && ctx.cookieJar) delete ctx.cookieJar;
  if (ctx && ctx.session) delete ctx.session;
};

exports.getCookie = function(ctx, which) {
  if (typeof which === 'string') which = new Regex('/^' + which + '$/');
  var cookieNames = Object.keys(ctx.cookieJar);
  for (var i = 0; i < cookieNames.length; i++) {
    if (which.test(cookieNames[i])) return ctx.cookieJar[cookieNames[i]];
  }
  return null;
};

/**
 * get - Makes an HTTP or HTTPS GET request to path on host and
 *       port from config.
 * cfg - Server configuration. See load_gen or unit tests
 * path - relative url
 * context - client.js browsing context
 * getArgs - Object
 * cb - function (err, resp) where resp has code, headers, and body properties
 */
exports.get = function(cfg, path, context, getArgs, cb) {
  // parse the server URL (cfg.browserid)
  var uObj;
  var meth;
  try {
    uObj = url.parse(cfg.browserid);
    meth = uObj.protocol === 'http:' ? http : https;
  } catch(e) {
    cb("can't parse url: " + e);
    return;
  }

  var headers = { };
  exports.injectCookies(context, headers);

  if (typeof getArgs === 'object')
    path += "?" + querystring.stringify(getArgs);

  meth.get({
    host: uObj.hostname,
    port: uObj.port,
    path: path,
    headers: headers,
    agent: false // disable node.js connection pooling
  }, function(res) {
    extractCookies(context, res);
    var body = '';
    res.on('data', function(chunk) { body += chunk; })
    .on('end', function() {
      cb(null, {code: res.statusCode, headers: res.headers, body: body});
    });
  }).on('error', function (e) {
    cb(e);
  });
};

function withCSRF(cfg, context, cb) {
  if (context.session && context.session.csrf_token) cb(null, context.session.csrf_token);
  else {
    exports.get(cfg, '/wsapi/session_context', context, undefined, function(err, r) {
      if (err) return cb(err);
      try {
        if (r.code !== 200) throw 'http error';
        context.session = JSON.parse(r.body);
        context.sessionStartedAt = new Date().getTime();
        cb(null, context.session.csrf_token);
      } catch(e) {
        console.log('error getting csrf token: ', e);
        cb(e);
      }
    });
  }
}

exports.post = function(cfg, path, context, postArgs, cb) {
  withCSRF(cfg, context, function(err, csrf) {
    if (err) return cb(err);

    // parse the server URL (cfg.browserid)
    var uObj;
    var meth;
    try {
      uObj = url.parse(cfg.browserid);
      meth = uObj.protocol === 'http:' ? http : https;
    } catch(e) {
      cb("can't parse url: " + e);
      return;
    }
    var headers = {
      'Content-Type': 'application/json'
    };
    exports.injectCookies(context, headers);

    if (typeof postArgs === 'object') {
      postArgs['csrf'] = csrf;
      body = JSON.stringify(postArgs);
      headers['Content-Length'] = body.length;
    }

    var req = meth.request({
      host: uObj.hostname,
      port: uObj.port,
      path: path,
      headers: headers,
      method: "POST",
      agent: false // disable node.js connection pooling
    }, function(res) {
      extractCookies(context, res);
      var body = '';
      res.on('data', function(chunk) { body += chunk; })
      .on('end', function() {
        cb(null, {code: res.statusCode, headers: res.headers, body: body});
      });
    }).on('error', function (e) {
      cb(e);
    });

    req.write(body);
    req.end();
  });
};
