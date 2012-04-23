/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.service = function (email) {
  if (typeof email !== 'string' || email.indexOf('@') < 0) {
    throw "Invalid email input to service function [" + email + "]" + (typeof email) + (email.indexOf('@'));
  }
  return email.split('@')[1];
};