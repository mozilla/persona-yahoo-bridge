/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Index into two element array
const DATE = 0;
const COUNTER = 1;

/**
 * An in memory data structure for a fixed capacity counter.
 * Each counter has an expiration.
 * A user can retry after earlier attempts expire.
 * Also, records expire, once their individual attempts
 * have expired, making room for new counters.
 */
module.exports = function(options) {

  options.capacity = options.capacity || 10;
  options.attempts = options.attempts || 5;
  options.ttlInSeconds = options.ttlInSeconds || 60 * 10; // 10 Minutes

  // Map email -> [timestamps]
  var counters = {};
  var MAX_COUNTERS = options.capacity;
  var MAX_ATTEMPTS = options.attempts;

  return {
    /**
     * Increments a counter based on a key (typically a user's email).
     * This should be used after checking with EventCounter.allowed()
     *
     * @param email - Key for this counter
     * @throws - Throws an Error if the user has exceeded their max attempts
     */
    increment: function(email) {
      this._ensureCounters(email);
      if (Object.keys(counters).length > MAX_COUNTERS) {
        throw new Error(
          'Programming error, attempted to create more counters that allowed');
      }
      if (counters[email][COUNTER] >= MAX_ATTEMPTS) {
        throw new Error(
          'Maximum events reached, unable to increment counter for ' +
          email + ' ' + counters[email].length);
      }
      counters[email][COUNTER]++;
    },
    /**
     * Checks an EventCounter instance to see if we can increment a
     * counter for the given key.
     * Reasons incrementing may not be allowed:
     * - Counter for this email have reached max allowed attempts
     * - Total number of counters in the system have reached max capacity
     *
     * @param email - Key for this counter
     * @return boolean - true if increment is allowed, false otherwise
     */
    allowed: function(email) {
      if (Object.keys(counters).length + 1 >= MAX_COUNTERS) {
        this._gc();
      }
      if (counters[email] && counters[email][COUNTER] >= MAX_ATTEMPTS) {
        this._expireCounter(email);
      }
      if (Object.keys(counters).length + 1 >= MAX_COUNTERS) return false;

      this._ensureCounters(email);
      return counters[email][COUNTER] < MAX_ATTEMPTS;
    },

    /* private */
    "_ensureCounters": function(email) {
      if (!counters[email]) {
        counters[email] = [new Date(), 0];
      }
    },
    "_expireCounter": function(email) {
      var timestamp = counters[email][DATE],
          then,
          that = this;

      then = new Date(that._getTime()),
      then.setSeconds(then.getSeconds() - options.ttlInSeconds);

      if (timestamp < then.getTime()) {
        delete counters[email];
      }
    },
    "_gc": function() {
      var emails = Object.keys(counters),
          that = this;

      if (! that._getTime) {
        throw new Error('What missing _getTime');
      }

      emails.forEach(function(email) {
        that._expireCounter(email);
      });
    },
    "_getTime": function() {
      return this.__time || new Date();
    },

    /* Testing APIs Below */
    "__time": undefined,
    "__setTime": function(then) {
      this.__time = new Date(then);
    },
    "__size": function() {
      return Object.keys(counters).length;
    },
    "__dump": function() {
      Object.keys(counters).forEach(function(email) {
        console.log('DUMP=', email);
        for (var i=0; i < counters[email].length; i++) {
          console.log('DUMP=', email, counters[email][i]);
        }
      });
      return counters;
    }
  };
};