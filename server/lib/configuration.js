/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var convict = require('convict'),
    fs = require('fs');

var conf = module.exports = convict({
  browserid_server: 'string = "https://browserid.org"',
  client_sessions: {
    cookie_name: 'string = "session_state"',
    secret: 'string = "YOU MUST CHANGE ME"',
    duration: 'integer = '  + (24 * 60 * 60 * 1000) // 1 day
  },
  issuer: 'string = "dev.bigtent.nutria.org"'
});

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env['CONFIG_FILES']) {
  var files = process.env['CONFIG_FILES'].split(',');
  files.forEach(function(file) {
    console.log('reading ', file);
    var c = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(c);
    conf.load(c);
  });
}