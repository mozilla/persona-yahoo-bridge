/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint esnext:true */

/* This file is the "provision" activity, which simulates the process of a
 * user with an active session adding a new email with browserid. */

const
certifier = require('../../../lib/certifier'),
client = require('../client'),
config = require('../../../lib/configuration'),
crypto = require('../../../lib/crypto'),
request = require('request'),
userdb = require('loady').userdb,
winston = require('winston');

// About twice a day our certificate has expired, but we still have
// an active session
exports.probability = (2 / 40.0);

var debug = false;

exports.startFunc = function (cfg, cb) {
  var user = userdb.getExistingUser();
  if (!user) {
    winston.warn("can't achieve desired concurrency!  not enough users!");
    return cb("not enough users");
  }

  if (debug) console.log('Usig http://', config.get('certifier_host'), config.get('certifier_port'));
  // TODO: have session and call through BigTent, instead of calling certifier direclty
  certifier(JSON.stringify(crypto.pubKey),
            'alice@gmail.com',
            60 * 60 * 6,
            function (err, body) {
    userdb.releaseUser(user);
    cb(err);
  });

};

if (require.main === module) {
  debug = true;
  userdb.addNewUser(userdb.getNewUser());

  exports.startFunc({base: 'https://127.0.0.1'}, function (err) {
    if (err) {
      console.log('Finished with ERROR');
      console.error(err);
    } else {
      console.log('Finished OK');
    }
  });
}