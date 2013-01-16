/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var config = require('../lib/configuration'),
    assocStore = require('../lib/association_store');

/* Shortly after startup, we want to Check that our configuration is
   reasonable. Can we talk to the certifier, does it have the same
   keypair, etc. */

module.exports = function () {
  assocStore.health(function (err) {
    if (err) {
      var ip_ports = config.get('memcached.ip_port_list');
      console.error('Unable to connect to memcached:' + JSON.stringify(ip_ports));
      console.error(err);
    }
    var host = config.get('certifier_host'),
    port = config.get('certifier_port'),
    lib = port === 443 ? require('https') : require('http');
    var r = lib.get({
      host: host,
      port: port,
      path: '/__heartbeat__'
    }, function (resp) {
      var heartbeat = '';
      resp.on('data', function (data) {
	heartbeat += data.toString('utf8');
      });
      resp.on('end', function (data) {
	if ('ok certifier' !== heartbeat.trim()) {
          console.error('Expected a certifier heartbeat response, instead got [' + heartbeat + ']');
	}
      });
      if (200 === resp.statusCode) {
	var resp_json = "",
        j = lib.get({
          host: host,
          port: port,
          path: '/public-key'
        }, function (resp) {
          resp.on('data', function (data) {
            resp_json += data.toString('utf8');
          });
          resp.on('end', function () {
            if (200 === resp.statusCode) {
              var ours = require('../lib/crypto').pubKey,
              theirs = JSON.parse(resp_json),
              complained = false;
              Object.keys(ours).forEach(function (key) {
                if (ours[key] !== theirs[key]) {
                  if (! complained) {
                    complained = true;
                    console.log(ours[key]);
                    console.log(theirs[key]);
                    console.error("BigTent and the Certifier have different public keys. This can't end well.");
                  }
                }
              });
            }
          });
        });
        j.on('error', function (err) {
          console.error('Unable to read public key at ' + host + ':' + port + ' [' + err + ']');
        });
      } else {
	console.error('Expected a 200 from /__heartbeat__ on certifier at ' + host + ':' + port + ', but got ' + resp.statusCode);
      }

    });
    r.on('error', function (err) {
      console.error('Expected a certifier at ' + host + ':' + port + ', but unable to communicate with it. [' + err + ']');
    });
  });
};