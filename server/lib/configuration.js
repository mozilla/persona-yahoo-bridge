/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const convict = require('convict'),
      fs = require('fs'),
      path = require('path');

// TODO protocol - BigTent ism, should use just use 'use_https' instead?
var conf = module.exports = convict({
  browserid_server: 'string = "https://browserid.org"',
  certifier_host: 'string = "127.0.0.1"',
  certifier_port: "integer{1,65535} = 8080",
  client_sessions: {
    cookie_name: 'string = "session_state"',
    secret: 'string = "YOU MUST CHANGE ME"',
    duration: 'integer = '  + (24 * 60 * 60 * 1000) // 1 day
  },
  default_lang: 'string = "en-US"',
  debug_lang: 'string = "it-CH"',
  disable_locale_check: {
    doc: "Skip checking for gettext .mo files for supported locales",
    format: 'boolean = false'
  },
  issuer: 'string = "dev.bigtent.mozilla.org"',
  process_type: 'string',
  protocol: 'string = "http"',
  statsd: {
    enabled: {
      doc: "enable UDP based statsd reporting",
      format: 'boolean = true',
      env: 'ENABLE_STATSD'
    },
    host: 'string = "localhost"',
    port: "integer{1,65535} = 8125"
  },

  locale_directory: 'string = "locale"',
  supported_languages: {
    doc: "List of languages this deployment should detect and display localized strings.",
    format: 'array { string }* = [ "en-US" ]',
    env: 'SUPPORTED_LANGUAGES'
  },
  use_https: 'boolean = false',
  var_path: {
    doc: "The path where deployment specific resources will be sought (keys, etc), and logs will be kept.",
    format: 'string?',
    env: 'VAR_PATH'
  },
  windows_live: {
    client_id: 'string = "00000000440BCC94"',
    client_secret: 'string = "NgepFX4ectJP-l-5XOymSqk4aLy7DJrE"'
  }
});

// At the time this file is required, we'll determine the "process name" for this proc
// if we can determine what type of process it is (browserid or verifier) based
// on the path, we'll use that, otherwise we'll name it 'ephemeral'.
conf.set('process_type', path.basename(process.argv[1], ".js"));

var dev_config_path = path.join(process.cwd(), 'config', 'local.json');
if (! process.env['CONFIG_FILES'] &&
    path.existsSync(dev_config_path)) {
  process.env['CONFIG_FILES'] = dev_config_path;
}

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env['CONFIG_FILES']) {
  var files = process.env['CONFIG_FILES'].split(',');
  files.forEach(function(file) {
    var c = JSON.parse(fs.readFileSync(file, 'utf8'));
    conf.load(c);
  });
}

// if var path has not been set, let's default to var/
if (!conf.has('var_path')) {
  conf.set('var_path', path.join(__dirname, "..", "var"));
}