Load Testing
============

Akin to browserid's load_gen, we have a load testing script.

Caveats
-------

BigTent is a very thin layer in front of a 3rd party service like OpenID. We have a mock server, but it doesn't implment 100% of the features, so our load test is incomplete, mostly exercising a failed signed OpenID request.

Although limited, it's hoped we can find memory leaks, concurrency bugs, and other scaling issues via this tool.

Usage
-----

    export CONFIG_FILES=server/config/local.json
    sudo HTTP_PROXY_PORT=8442 HTTPS_PROXY_PORT=8443 node server/bin/bigtent
    loady -c server/tests/load_gen.js -s https://dev.bigtent.mozilla.org

Output
------

    To start, let's create 100 users via the API.  One moment please...
    ....................................................................................................

    Activities Map:
    (#ti) is tobi
    (#pl) is provision_gmail
    (#wn) is well_known
    (#re) is refresh_certificate
    (#pl) is provision_hotmail
    (#po) is provision_yahoo

    Simulating 10000 active daily users, who do 40 activities per day
    Average active users simulated over the last 1s/5s/60s:
         0.00    0.00    0.00    0 R, 5 S (0ti 0pl 0wn 0re 0pl 0po)
         10821.60    10821.60    10821.60    0 R, 13 S (0ti 0pl 0wn 0re 0pl 0po)
         17314.56    14068.08    14068.08    0 R, 25 S (0ti 0pl 0wn 0re 0pl 0po)

Activities
----------

The following activiites happen during load:

* `provision_yahoo.js` - twice a day
    * GET /provision
    * GET /provision.js
    * GET /authentication
    * GET /proxy/user@yahoo.com
    * GET /auth/yahoo/return
* `refresh_certificate.js` - twice a day
    * POST to Certifier deamon (direct, not via POST /provision)
* `well_known.js` - 100 times a day
* `general_error.js` - every 2 weeks
* `heartbeat_b.js` - every 5 minutes

### Naming ###

loady uses the first and last characters of the JS filename to name the activity, so
some files are named wacky to make it easier to remember in the output.

**Example**: heartbeat is heartbeat_b.js to produce (1hb).

Options
-------

Several options can be given on the command line to tweak various parts of load.

Individual Activities
---------------------

During development of the load gen tool, it is often useful to run an activity once in isolation.

    node server/tests/lib/load_gen/provision_yahoo.js