#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* scripts/gen_keys.js creates public and private keys suitable for
   key signing Persona Primary IdP's.

   Usage:
   scripts/gen_keys.js

   Will create a new keypair at
     var/server_public_key.json
     var/server_secret_key.json

   If these files already exist, this script will show an error message
   and exit. You must remove both keys if you want to generate a new
   keypair.
*/
const path = require('path');
// ./server is our current working directory
process.chdir(path.join(path.dirname(__dirname), 'server'));

const jwk = require("jwcrypto/jwk"),
      store = require('../server/lib/keypair_store'),
      util = require('util');

var error_remove_keypair = function () {
    console.error("Old keypair detected, you must remove these files to generate new ones.")
    console.log("Usage: gen_keys.js\n\nWill create a new keypair under var.");
    process.exit(1);
}

store.files_exist(function (exists) {
  if (exists) {
    error_remove_keypair();
  } else {
    // generate a fresh 1024 bit RSA key
    var keypair = jwk.KeyPair.generate('RS', 256);
    store.write_files(keypair, function (err) {
      console.error("Problem writing public key, existing");
      console.error(err);
      process.exist(2);
    }, function (err) {
      console.error("Problem writing secret key, existing");
      console.error(err);
      process.exist(3);
    });
  }
});