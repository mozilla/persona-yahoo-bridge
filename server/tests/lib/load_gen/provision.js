/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file is the "provision" activity, which simulates the process of a
 * user with an active session adding a new email with browserid. */

// Once ever two weeks, our session has expired
exports.probability = (1 / 40.0);
exports.startFunc = function (cfg, cb) {
  if (Math.random() > 1.1)
    cb('Error in provisioning');
  else
    cb(null);
};