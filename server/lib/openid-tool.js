/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const email = require('./validation/email');

function validParams(params) {
  /* jshint maxcomplexity:15 */

  // reject any duplicate parameters: each must be a string, not an array
  Object.keys(params).forEach(function (key) {
    if (typeof params[key] !== 'string') { return false; }
  });

  var signed_str = params['openid.signed'] || '';
  if (!/^[\w\.\,]*$/.test(signed_str)) { return false; }
  var signed = signed_str.split(',');
  signed.forEach(function (key) {
    var value = params['openid.'+key];
    if (typeof value !== 'string') { return false; }
    if (/\n/.test(value)) { return false; }
  });

  // first, make sure the Claimed ID is a Yahoo one.
  if (signed.indexOf('claimed_id') === -1 ) { return false; }
  if (typeof params['openid.claimed_id'] !== 'string') { return false; }
  if (params['openid.claimed_id'].indexOf('https://me.yahoo.com/') !== 0) {
    return false;
  }

  // And because this is only a Yahoo bridge, hardcode the OpenID Endpoint
  if (signed.indexOf('op_endpoint') === -1 ) { return false; }
  var yahooEndpoint = 'https://open.login.yahooapis.com/openid/op/auth';
  if (params['openid.op_endpoint'] !== yahooEndpoint) { return false; }

  // Find all AXSchema email types
  var emailTypes = [];
  Object.keys(params).forEach(function (key) {
    if (params[key] === 'http://axschema.org/contact/email') {
      emailTypes.push(key);
    }
  });

  // We should only have one potential email type to inspect.
  if (emailTypes.length !== 1) { return false; }

  // That type should be under a key formatted 'openid.NAMESPACE.type.TYPENAME'
  // If the regex matches, it returns [match, NAMESPACE, TYPENAME]
  var parts = emailTypes[0].match(/^openid\.(\w+)\.type\.(\w+)$/);
  if (!parts || parts.length !== 3) { return false; }

  var namespace = parts[1];
  var typename = parts[2];

  // The associated value should exist at openid.NAMESPACE.value.TYPENAME.
  // It should be a valid email address.
  var emailValuePath = 'openid.' + namespace + '.value.' + typename;
  if (!email(params[emailValuePath])) { return false; }

  // NAMESPACE must be registered under openid.ns.NAMESPACE
  var nsPath = 'openid.ns.' + namespace;

  if (params[nsPath] !== 'http://openid.net/srv/ax/1.0') { return false; }
  // The namespace, email type, and email value must all be signed
  if (signed.indexOf('ns.' + namespace) === -1) { return false; }
  if (signed.indexOf(namespace + '.value.' + typename) === -1) { return false; }
  if (signed.indexOf(namespace + '.type.' + typename) === -1) { return false; }

  return true;
}

exports.validParams = validParams;
