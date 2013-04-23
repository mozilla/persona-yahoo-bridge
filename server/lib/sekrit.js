/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* All of the crypto-fu was cribbed from node-client-sessions */

const crypto = require('crypto');

function base64urlencode(arg) {
  var s = new Buffer(arg).toString('base64');
  s = s.split('=')[0]; // Remove any trailing '='s
  s = s.replace(/\+/g, '-'); // 62nd char of encoding
  s = s.replace(/\//g, '_'); // 63rd char of encoding
  return s;
}

function base64urldecode(arg) {
  var s = arg;
  s = s.replace(/-/g, '+'); // 62nd char of encoding
  s = s.replace(/_/g, '/'); // 63rd char of encoding
  switch (s.length % 4) // Pad with trailing '='s
  {
  case 0: break; // No pad chars in this case
  case 2: s += "=="; break; // Two pad chars
  case 3: s += "="; break; // One pad char
  default: throw new Error("Illegal base64url string!");
  }
  return new Buffer(s, 'base64'); // Standard base64 decoder
}

function deriveKey(master, type) {
  var hmac = crypto.createHmac('sha256', master);
  hmac.update(type);
  return hmac.digest('binary');
}

function sign(opts, emailA, emailB){
  // format will be:
  // iv.emailA.emailB.hmac

  // generate iv
  var iv = crypto.randomBytes(16);

  // hmac it
  var hmacAlg = crypto.createHmac('sha256', opts.signatureKey);
  hmacAlg.update(iv);
  hmacAlg.update(".");
  hmacAlg.update(emailA);
  hmacAlg.update(".");
  hmacAlg.update(emailB);

  var hmac = hmacAlg.digest();
  return base64urlencode(iv) + "." + base64urlencode(emailA) + "." +
         base64urlencode(emailB) + "." + base64urlencode(hmac);
}

function verify(opts, content) {

  // stop at any time if there's an issue
  var components = content.split(".");
  if (components.length != 4)
    return [];

  var iv = base64urldecode(components[0]);
  var emailA = base64urldecode(components[1]);
  var emailB = base64urldecode(components[2]);
  var hmac = base64urldecode(components[3]);

  // make sure IV is right length
  if (iv.length != 16)
    return [];

  // check hmac
  var hmacAlg = crypto.createHmac('sha256', opts.signatureKey);
  hmacAlg.update(iv);
  hmacAlg.update(".");
  hmacAlg.update(emailA);
  hmacAlg.update(".");
  hmacAlg.update(emailB);

  var expected_hmac = hmacAlg.digest();

  if (hmac.toString('utf8') != expected_hmac.toString('utf8'))
    return [];

  return [emailA.toString('utf8'), emailB.toString('utf8')];
}

module.exports = function(opts) {
  if (!opts)
    throw "no options provided, some are required"; // XXX rename opts?

  if (!opts.secret)
    throw "cannot set up sessions without a secret";

  if (!opts.signatureKey)
    opts.signatureKey = deriveKey(opts.secret, 'cookiesession-signature');

  return {
    /**
     * Creates a short string suitable for:
     * - Proving the user has clicked a link in email
     * - Showing it is specific to emailA and emailB
     * - Making it difficult to forge
     */
    createAccountLink: function(emailA, emailB, cb) {
      cb(null, sign(opts, emailA, emailB));
    },

    /**
     * Checks that a sekrit was signed by this server
     * and is indeed valid.
     */
    checkAccountLink: function(sekrit, cb) {
      var emails = verify(opts, sekrit);
      if (emails.length === 2) {
        cb(null, emails);
      } else {
        cb(new Error('Invalid sekrit'), []);
      }
    }
  };
};