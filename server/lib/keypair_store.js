/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
fs = require('fs'),
path = require('path'),
util = require('util');

const
PUBLIC_KEY_FILENAME = 'key.publickey';

var
pub_key_filename = util.format('var/%s', PUBLIC_KEY_FILENAME);

/**
 * Reads JSON formatted jwcrypto public key from filesystem.
 * Takes callback with arguments err, pubKey
 *
 * Method is synchronous as it's used from other modules during loading.
 */
exports.read_pubkey_sync = function (callback) {
  var pub_exists = path.existsSync(pub_key_filename);
  if (! pub_exists) {
    return callback("Missing public key, cannot read files");
  }
  try {
    var pubKey = JSON.parse(fs.readFileSync(pub_key_filename, 'utf8'));
    callback(null, pubKey);
  } catch (e) {
    // File IO or malformed JSON
    console.trace(e);
    callback(e.toString());

  }
};
