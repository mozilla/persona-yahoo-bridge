/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const email = require('./validation/email');

function validParams(params) {
  /* jshint maxcomplexity:15 */

  // Find all AXSchema email types
  var emailTypes = [];

    console.log('boo ya');

  Object.keys(params).forEach(function (key) {
    if (params[key] === 'http://axschema.org/contact/email') {
      emailTypes.push(key);
    }
  });

    console.log('boo ya 2');
  // We should only have one potential email type to inspect.
  if (emailTypes.length !== 1) { return false; }

  // That type should be under a key formatted 'openid.NAMESPACE.type.TYPENAME'
  // If the regex matches, it returns [match, NAMESPACE, TYPENAME]
  var parts = emailTypes[0].match(/^openid\.([^\.]+)\.type\.([^\.]+)$/);
  if (!parts || parts.length !== 3) { return false; }

  var namespace = parts[1];
  var typename = parts[2];

    console.log('boo ya 3');
  // The associated value should exist at openid.NAMESPACE.value.TYPENAME.
  // It should be a valid email address.
  var emailValuePath = 'openid.' + namespace + '.value.' + typename;
    console.log(emailValuePath, params[emailValuePath]);
  if (!email(params[emailValuePath])) { return false; }

  // NAMESPACE must be registered under openid.ns.NAMESPACE
  var nsPath = 'openid.ns.' + namespace;

  console.log(nsPath, params[nsPath]);
  if (params[nsPath] !== 'http://openid.net/srv/ax/1.0') { return false; }
    console.log('boo ya 4');
  // The namespace, email type, and email value must all be signed
  var signed = (params['openid.signed'] || '').split(',');
  if (signed.indexOf('ns.' + namespace) === -1) { return false; }
  if (signed.indexOf(namespace + '.value.' + typename) === -1) { return false; }
  if (signed.indexOf(namespace + '.type.' + typename) === -1) { return false; }

  // Lastly, because this is only a Gmail bridge, hardcode the OpenID Endpoint
  var yahooEndpoint = 'https://open.login.yahooapis.com/openid/op/auth';
  if (params['openid.op_endpoint'] !== yahooEndpoint) { return false; }
  if (signed.indexOf('op_endpoint') === -1 ) { return false; }
    console.log('boo ya 5');
  // ...and make sure the Claimed ID is a Yahoo one.
  var yahooAccountRegex = /^https:\/\/me.yahoo.com\/a\//;
  if (!yahooAccountRegex.test(params['openid.claimed_id'])) { return false; }
  if (signed.indexOf('claimed_id') === -1 ) { return false; }
    console.log('boo ya 6');
  return true;
}

exports.validParams = validParams;
