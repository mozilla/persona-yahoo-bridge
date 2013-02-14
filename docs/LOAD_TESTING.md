Load Testing
============

Akin to browserid's load_gen, we have a load testing script.

Caveats
-------

BigTent is a very thin layer in front of a 3rd party service like OpenID. We have a mock server, but it doesn't implment 100% of the features, so our load test is incomplete, mostly exercising a failed signed OpenID request.

Although limited, it's hoped we can find memory leaks, concurrency bugs, and other scaling issues via this tool.

Usage
-----

    node server/tests/mock_proxy_idp.js
    export CONFIG_FILES=server/config/local.json
    sudo HTTP_PROXY_HOST=localhost HTTPS_PROXY_HOST=localhost \
         HTTP_PROXY_PORT=8442 HTTPS_PROXY_PORT=8442 node server/bin/bigtent
    CONFIG_FILES=server/config/local.json loady -c server/tests/load_gen.js -s https://dev.bigtent.mozilla.org

Output
------

    To start, let's create 100 users via the API.  One moment please...
    ....................................................................................................

    Activities Map:
    (#ge) is general_error_e
    (#hb) is heartbeat_b
    (#py) is provision_yahoo_y
    (#wn) is well_known
    (#rc) is refresh_certificate_c

    Simulating 10000 active daily users, who do 40 activities per day
    Average active users simulated over the last 1s/5s/60s:
	0.00    0.00    0.00    5 R, 5 S (0ge 2hb 0py 3wn 0rc)
	10810.80    10810.80    10810.80    8 R, 13 S (1ge 3hb 2py 2wn 0rc)
	12998.88    11904.84    11904.84    11 R, 22 S (0ge 5hb 3py 2wn 1rc)
	21600.00    15136.56    15136.56    16 R, 37 S (2ge 7hb 2py 4wn 1rc)
	32367.60    19444.32    19444.32    23 R, 59 S (5ge 11hb 5py 1wn 1rc)
	38957.76    23347.01    23347.01    32 R, 86 S (7ge 10hb 8py 5wn 2rc)
	51788.16    29035.24    28087.20    44 R, 122 S (2ge 19hb 12py 8wn 3rc)
	75675.60    38363.31    34885.54    62 R, 175 S (9ge 27hb 13py 10wn 3rc)
	108000.00   52290.65    44024.85    87 R, 250 S (18ge 36hb 18py 13wn 2rc)
	6480.00     43128.52    39853.20    84 R, 250 S (18ge 36hb 17py 13wn 0rc)

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

Mock Yahoo Openid
-----------------

We don't actually want to load 3rd party web services ;) So we do a couple things to
mock out their part of the authentication loop.

We set the following ENV variables:

* HTTP_PROXY_HOST=localhost
* HTTP_PROXY_PORT=8442
* HTTPS_PROXY_HOST=localhost
* HTTPS_PROXY_PORT=8443

There is a script you must run called
`server/tests/mock_proxy_idp.js`. This mock OpenID server listens on 8442 and 8443.
The load test sends in canned requests and it sends back canned responses. Eventually
it will do the actual OpenID protocol, and should be run on a seperate box.