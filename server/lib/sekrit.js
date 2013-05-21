/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creates a PIN code suitable for:
 * - Proving the user has verified their email address
 * - Making it difficult to guess
 */
exports.createPinCode = function(cb) {
  var pin = Math.floor(Math.random() * 999999) + "";
  while (pin.length < 6) pin = "0" + pin;
  cb(null, pin);
};