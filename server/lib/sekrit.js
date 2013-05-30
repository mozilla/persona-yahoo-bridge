/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./configuration.js'),
      crypto = require('crypto');

const PIN_LEN = config.get('pin_length');

/**
 * Creates a PIN code suitable for:
 * - Proving the user has verified their email address
 * - Making it difficult to guess
 */
exports.createPinCode = function(cb) {
  var pin = "";
  crypto.randomBytes(PIN_LEN, function(ex, bytes) {
    if (ex) return cb(ex);
    for (var i=0; i < PIN_LEN; i++) {
      // Get a random decimal
      pin += bytes.readUInt8(i) % 10;
    }
    cb(null, pin);
  });
};