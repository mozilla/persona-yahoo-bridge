# Operations Notes #

BigTent is a IdP Proxy service. It bridges gmail.com, yahoo.com, and hotmail.com email addresses so that they look like Google, Yahoo, and Microsoft are running BrowserID Primary enabled servers.

In Practise, this server **looks like a primary**!

Although it has a ``/.well-known/browserid`` file, _only the ``public-key`` field is used_. The [BrowserID codebase](https://github.com/mozilla/browserid) has the provisioning and authentnication urls hardcoded into it's configs.

## Windows Live API Key
Most IdPs we proxy use OpenID, but Windows Live requires an API Key. This means two things - domain name and API key must match, API key must be registred with Microsoft. Real keys are managed by Ops.

## Public and Secret Keypair
This server does cryptographic operations as part of the Persona Primary protocol.

You must have public/secret keys. There are several ways to achieve this:
* Using the following environment variables: ``PUBLIC_KEY`` ``PRIVATE_KEY``
* Using scripts/gen_keys.js to create ``server/var/server_secret_key.json``  ``server/var/server_public_key.json``
* Letting the server automatically create ``ephemeral`` keys, which change on restart

Ephemeral is only appropriate in development environments. If deploying Vinz Clortho in a clustered environment, all
servers must have the same keypair.

### Protect the keys
The server_secret_key.json key is extremely sensative, protect it!

Only the public key can be shared via HTTP.

## External Requests
Documented in [Issue 23](https://github.com/mozilla/browserid-bigtent/issues/23).

## Monitoring
BigTent has statsd prefixed to ``bigtent`` for the following:

Counters:
* HTTP Requests at the start of a route
* Things we log warnings on
* Things we log errors on
* [Things that make you go Hmmm](http://en.wikipedia.org/wiki/Things_That_Make_You_Go_Hmmm...)

Timers:
* HTTP Requests amount of time spent servicing request

### Heartbeats

You can make a request to ``/__heartbeat__``.

### Version

During deployment you should create

    static/ver.txt

This should have the last git commit and sha as well as SVN version. Example contents:

943d308 bump to 0.2012.04.27.5, and document changes in .4 and .5
locale svn r105105
