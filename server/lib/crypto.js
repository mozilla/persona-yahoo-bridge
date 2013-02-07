/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
jwcrypto = require("jwcrypto"),
logger = require("./logging").logger,
store = require('./keypair_store');

// load algorithms
require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

var _pubKey,
    _err,
    fsChecked = false,
    jwcryptoStarted = false;

exports.pubKey = function(cb) {
  function tryAgain() {
    setTimeout(function() {
      exports.pubKey(cb);
    }, 100);
  }

  // _pubKey populated by ENV, file system, or jwcrypto
  if (!! _pubKey) {
    cb(null, _pubKey);
  } else if (!! _err) {
    cb(_err);
  } else if (false === fsChecked) {
    // Wait for FS check to complete
    tryAgain();
  } else {
    if (false === jwcryptoStarted) {
      jwcryptoStarted = true;
      // if no key is provided, emit a nasty message and generate some
      logger.warn("WARNING: you're using ephemeral keys. They will be purged at restart.");
      // generate a fresh 1024 bit RSA key
      jwcrypto.generateKeypair({algorithm: 'RS', keysize: 256},
                               function(err, keypair) {
        if (err) {
           logger.error('Unable to generate ephemeral keys with jwcrypto');
           logger.error(err);
           _err = err;
        } else {
           _pubKey = JSON.parse(keypair.publicKey.serialize());
        }

      });
    }

    // Wait for jwcrypto to finish
    tryAgain();
  }
};

try {
  _pubKey = JSON.parse(process.env.PUBLIC_KEY);
} catch (e) { }

if (!_pubKey) {
  // Kick off a check for our var file system cache
  try {
    store.read_pubkey_sync(function(err, publicKey) {
      fsChecked = true;
      if (! err) {
        _pubKey = publicKey;
      }
    });
  } catch (e) {
    fsChecked = true;
  }
}