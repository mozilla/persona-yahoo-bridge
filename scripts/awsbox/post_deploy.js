#!/usr/bin/env node

var fs = require('fs');
var config = '/home/app/local.json',
    devConfig = '/home/app/code/server/config/local.json';

var reportError = function (err, fatal) {
  fatal = fatal || true;
  console.error(err);
  if (fatal) process.exit(1);
};

process.stdout.write('Deploying config and public key\n');

fs.readFile(config, 'utf8', function (err, data) {
  if (err) {
      reportError(err);
  }
  fs.writeFile(devConfig, data, 'utf8', function (err) {
    if (err) {
      reportError(err);
    }
    process.stdout.write('Updated ' + devConfig + '\n');
      var key = '/home/app/browserid-certifier/var/key.publickey',
          dir = '/home/app/code/server/var',
          devKey = dir + '/key.publickey';

      fs.readFile(key, 'utf8', function (err, data) {
        if (err) {
          reportError(err);
        }
        fs.mkdir(dir, function (err) {
          if (err) {
            reportError(err, false);
          }
          fs.writeFile(devKey, data, 'utf8', function (err) {
            if (err) {
              reportError(err);
            }
            process.stdout.write('Updated ' + devKey + '\n');
        });
      });
    });
  });
});