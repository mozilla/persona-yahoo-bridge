/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var config = require('./configuration'),
    logger = require('./logging').logger,
    redis = require('redis'),
    statsd = require('./statsd');

var redisConf = config.get('redis');
var client;

function handleRedisError(err) {
  logger.error('Redis error, re-connecting');
  logger.error(err);
}

function initRedis() {
    client = redis.createClient();
    client.on('error', handleRedisError);
}

initRedis();

exports.health = function(cb) {
  client.ping(function(err, pong) {
    if (err) {
      cb(err);
    } else if (pong !== 'PONG') {
      cb('REDIS failed health check. Expected PONG got ' + JSON.stringify(pong));
    } else {
      cb(null);
    }
  });
};

exports.saveAssociation = function(handle, provider, algorithm, secret, expiresIn, cb) {
  if (typeof handle !== 'string' ||
      typeof provider !== 'object' ||
      typeof algorithm !== 'string' ||
      typeof secret !== 'string' ||
      typeof expiresIn !== 'number' ||
      typeof cb !== 'function') {
    return cb("Bad input to saveAssociation");
  }

  var value = JSON.stringify({provider: provider, algorithm: algorithm, secret: secret});
  client.set(handle, value, function(err, reply) {
    if (err) {
      statsd.increment('assoc_store.redis.set.error');
      logger.error(err);
      cb(err);
    } else if (! reply) {
      statsd.increment('assoc_store.redis.set.failure');
      cb('Unable to set assoc handle in redis');
    } else {
      client.expire(handle, expiresIn, function(err, reply) {
        if (err) {
          statsd.increment('assoc_store.redis.expire.error');
          logger.error(err);
          cb(err);
        } else if (! reply) {
          statsd.increment('assoc_store.redis.expire.failure');
          cb('Unable to set assoc handle in redis');
        } else {
          statsd.increment('assoc_store.redis.setandexpire.ok');
          cb();
        }
      });
    }
  });
};

exports.loadAssociation = function(handle, cb) {
  if (typeof handle !== 'string' ||
      typeof cb !== 'function') {
    return cb("Bad input to loadAssociation");
  }

  client.get(handle, function(err, res) {
    if (err) {
      statsd.increment('assoc_store.redis.get.error');
      logger.error(err);
      cb(err);
    } else {
      statsd.increment('assoc_store.redis.get.ok');
      var data = JSON.parse(res);
      cb(null, data.provider, data.algorithm, data.secret);
    }
  });
};

// Our Vows tests need this... but not anything else...
exports.quit = function(cb) {
  client.quit(function(err, reply) {
    cb(err, reply);
  });
};