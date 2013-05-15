/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* All of the crypto-fu was cribbed from node-client-sessions */

const crypto = require('crypto');

module.exports = function(opts) {
  if (!opts)
    throw "no options provided, some are required"; // XXX rename opts?

  return {
    /**
     * Creates a PIN code suitable for:
     * - Proving the user has verified their email address
     * - Making it difficult to guess
     */
    createPinCode: function(claimedEmail, cb) {
      var pin = Math.floor(Math.random() * 9999999) + "";
      while (pin.length < 7) pin = "0" + pin;
      cb(null, pin);
    }
  };
};