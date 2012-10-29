/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
config = require('./configuration'),
fs = require('fs'),
util = require('util');

/**
 * Reads JSON formatted jwcrypto public key from filesystem.
 * Takes callback with arguments err, pubKey
 *
 * Method is synchronous as it's used from other modules during loading.
 */
exports.read_pubkey_sync = function(callback) {
  var pub_key_path = config.get('pub_key_path');
  if (! fs.existsSync(pub_key_path)) {
    return callback("Missing public key, cannot read files");
  }
  try {
    var pubKey = JSON.parse(fs.readFileSync(pub_key_path, 'utf8'));
    callback(null, pubKey);
  } catch (e) {
    // File IO or malformed JSON
    console.trace(e);
    callback(e.toString());
  }
};
