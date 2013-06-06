/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
config = require('../lib/configuration'),
vows = require('vows'),
EventCounter = require('../lib/event_counter');

var suite = vows.describe('event-counter-test');

suite.addBatch({
  'A PIN counter should limit attempts': function() {

    var ec = EventCounter({
      capacity: 3,
      attempts: 5,
      ttlInSeconds: 10 * 60 // 10 minutes
    });


    var now = new Date();
    var elevenMinutes = new Date(now);
    elevenMinutes.setMinutes(now.getMinutes() + 11);

    // User types in wrong PIN
    ec.increment('a@b.com'); // 1
    if (ec.allowed('a@b.com')) {
      assert(true, 'We can increment a second time');
      ec.increment('a@b.com'); // 2
      ec.increment('a@b.com'); // 3
      ec.increment('a@b.com'); // 4
    } else {
      throw new Error('a@b.com should have been able to do PIN comparison again');
    }

    if (ec.allowed('a@b.com')) {
      assert(true, 'We can make a fifth increment');
    } else {
      throw new Error('a@b.com SHOULD have been able to do PIN comparison again');
    }

    ec.increment('a@b.com'); // 5

    assert.equal(ec.allowed('a@b.com'), false, 'a@b.com is out of failed attempts, not allowed');

    assert.throws(function() {
      ec.increment('a@b.com');
    });

    // Fragile test - implementation specific, feel free to nuke / change
    assert.equal(ec.__size(), 1);

    // 11 minutes have passed
    ec.__setTime(elevenMinutes);

    // Cause memory to be reclaimed
    assert(ec.allowed('a@b.com'), 'After 11 minutes, we can increment again');
    ec.increment('a@b.com');

    // Fragile
    assert.ok(1 <= ec.__size(), 'Time heals all wounds');

  },
  'A PIN counter should limit number of counters': function() {
    var now = new Date();
    var elevenMinutes = new Date(now);
    elevenMinutes.setMinutes(now.getMinutes() + 11);

    var ec = EventCounter({
      capacity: 3,
      attempts: 5,
      ttlInSeconds: 10 * 60 // 10 minutes
    });

    ec.increment('a1@b.com');
    ec.increment('a2@b.com');
    ec.increment('a3@b.com');

    assert.equal(ec.allowed('a4@b.com'), false, 'Event counter full, no new counters');
    assert.throws(function() {
      ec.increment('a4@b.com');
    });

    // Fragile
    assert.equal(ec.__size(), 4);

    // 11 minutes have passed
    ec.__setTime(elevenMinutes);

    // Cause memory to be reclaimed
    assert(ec.allowed('a4@b.com'), 'After time, we can create space for a new email');
    ec.increment('a4@b.com');

    // Fragile
    assert.ok(1 <= ec.__size(), 'Time heals all wounds');
  }
});

// run or export the suite.
if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
