/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint esnext:true */

/* This file is the "request well known" activity, which simulates the process of a
 * a verifier or client looking up /.well-known/browserid  */

const
request = require('request'),
client = require('../client'),
userdb = require('loady').userdb,
winston = require('winston');

// Once ever two weeks, our session has expired
exports.probability = (8 / 40.0);

var debug = false;

exports.startFunc = function (cfg, cb) {

  var the_url = client.url('/.well-known/browserid', cfg);
  var user = userdb.getExistingUser();
  if (!user) {
    winston.warn("can't achieve desired concurrency!  not enough users!");
    return cb("not enough users");
  }
  user.request.get({
    url: the_url
  }, function (err, r, body) {
    userdb.releaseUser(user);
    if (err) {
        cb(err);
    } else if (r.statusCode !== 200) {
        cb("Non 200 status code " + r.statusCode);
    } else {
        cb(null);
    }
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
