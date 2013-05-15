#!/usr/bin/env node

var fs = require('fs'),
    child_process = require('child_process');
var config = '/home/app/config.json',
    devConfig = '/home/app/code/server/config/local.json';

var reportError = function(err, fatal) {
  if (fatal === undefined) fatal = true;
  console.error(err);
  if (fatal) process.exit(1);
};
process.stdout.write('Deploying config and public key\n');
fs.readFile(config, 'utf8', function(err, data) {
  if (err) {
      reportError(err);
  }
  fs.writeFile(devConfig, data, 'utf8', function(err) {
    if (err) {
      reportError(err);
    }
    process.stdout.write('Updated ' + devConfig + '\n');
      var key = '/home/app/browserid-certifier/var/key.publickey',
          dir = '/home/app/code/server/var',
          devKey = dir + '/key.publickey';

      fs.readFile(key, 'utf8', function(err, data) {
        if (err) {
          reportError(err);
        }
        fs.mkdir(dir, function(err) {
          if (err) {
            reportError(err, false);
          }
          fs.writeFile(devKey, data, 'utf8', function(err) {
            if (err) {
              reportError(err);
            }
            process.stdout.write('Updated ' + devKey + '\n');
            process.stdout.write('Compressing CSS and JS\n');
            var comp = child_process.spawn('/home/app/code/scripts/compress',
                                               [], {cwd: '/home/app/code'});
            comp.stdout.on('data', function(data) {
              process.stdout.write(data);
            });
            comp.stderr.on('data', function(data) {
              process.stdout.write('ERROR: ' + data);
            });
          });
        });
      });
  });
});