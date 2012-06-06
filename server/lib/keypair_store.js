/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
fs = require('fs'),
path = require('path'),
util = require('util');

const
PUBLIC_KEY_FILENAME = 'server_public_key.json',
SECRET_KEY_FILENAME = 'server_secret_key.json';

var
pub_key_filename = util.format('var/%s', PUBLIC_KEY_FILENAME),
priv_key_filename = util.format('var/%s', SECRET_KEY_FILENAME);

/**
 * Checks to see if either server public or secret keys already exist.
 * Takes a callback with one argument exists - a boolean.
 * exists will be true if either file already exists.
 */
exports.files_exist = function (callback) {
    path.exists(pub_key_filename, function (pub_exists) {
      if (pub_exists) {
        callback(pub_exists);
      } else {
        path.exists(priv_key_filename, function (priv_exists) {
          callback(priv_exists);
        });
      }
    });
};

/**
 * Given a jwcrypto public/private keypair, serializes them to the
 * filesystem. Two optional callbacks can be provided for errors
 * generated while writing public and secret files.
 */
exports.write_files = function (keypair, pub_cb, secr_cb) {
  fs.writeFile(pub_key_filename, keypair.publicKey.serialize(), 'utf8', function (err) {
    if (err) {
      pub_cb(err);
    }
  });
  fs.writeFile(priv_key_filename, keypair.secretKey.serialize(), 'utf8', function (err) {
    if (err) {
      secr_cb(err);
    }
  });
};

/**
 * Reads JSON formatted jwcrypto public/private keypair from filesystem.
 * Use write_files to create these files.
 * Takes callback with arguments err, pubKey and secretKey
 *
 * Method is synchronous as it's used from other modules during loading.
 */
exports.read_files_sync = function (callback) {
  var pub_exists = path.existsSync(pub_key_filename);
  if (! pub_exists) {
    return callback("Missing public key, cannot read files");
  }
  var priv_exists = path.existsSync(priv_key_filename);
  if (! priv_exists) {
    return callback("Missing secret key, cannot read files");
  }
  try {
    var pubKey = JSON.parse(fs.readFileSync(pub_key_filename, 'utf8')),
        privKey = JSON.parse(fs.readFileSync(priv_key_filename, 'utf8'));
    callback(null, pubKey, privKey);
  } catch (e) {
    // File IO or malformed JSON
    console.trace(e);
    callback(e.toString());

  }
};
