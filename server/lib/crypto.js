/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
jwk = require("jwcrypto/jwk"),
logger = require("./logging").logger,
store = require('./keypair_store');

// TODO populate chiainCert from file system
exports.chainedCert = null;

try {
  exports.pubKey = JSON.parse(process.env.PUBLIC_KEY);
} catch(e) { }
// or var file system cache
if (!exports.pubKey) {
  try {
    store.read_files_sync(function (err, publicKey) {
      if (! err) {
        exports.pubKey = publicKey;
      }
    });
  } catch (e) { }
}

if (!exports.pubKey) {
  if (exports.pubKey !== exports.privKey) {
    throw "inconsistent configuration!  if privKey is defined, so must be pubKey";
  }
  // if no keys are provided emit a nasty message and generate some
  logger.warn("WARNING: you're using ephemeral keys.  They will be purged at restart.");

  // generate a fresh 1024 bit RSA key
  var keypair = jwk.KeyPair.generate('RS', 256);

  exports.pubKey = JSON.parse(keypair.publicKey.serialize());
}