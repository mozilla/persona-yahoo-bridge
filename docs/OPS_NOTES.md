Operations Notes
================

BigTent is a BrowserID Identity Provider (IdP) Proxy service. It bridges
`gmail.com`, `yahoo.com`, and `hotmail.com` email addresses so that it looks
like Google, Yahoo, and Microsoft are running BrowserID enabled servers.

In practice, this server **looks like an IdP**!

Although it has a `/.well-known/browserid` file, *only the ``public-key``
field is used*. The [BrowserID codebase](https://github.com/mozilla/browserid)
has the provisioning and authentication urls hardcoded into it's configs.

Certifier
---------

This server depends on a [certifier](https://github.com/mozilla/browserid-certifier).

The public key for BigTent **must** match the keypair deployed to the certifier.

BigTent will refuse to startup if this is not the case.

Public Key
----------

BigTent must have a public key. There are several ways to achieve this:

-   Use the environment variables `PUBLIC_KEY`.
-   Use `./node_modules/jwcrypto/bin/generate-keypair` to create
    `key.publickey` and `key.secretkey`. These should be stored with the
    BrowserID Certifier, as defined in its configuration, and a copy of the
    public key should be placed in BigTent's `server/var/` directory.
-   Do nothing and let the server generate its own "ephemeral keys," which will
    change on each restart.

In practice, you'll want stable keys that match your certifier.

API Keys: Windows Live (Hotmail)
--------------------------------

While we use OpenID for Google and Yahoo, Microsoft only supports OAuth2, and
thus requires an API key. This means two things:

1.  Each domain must have a matching API key.
2.  Each API key must be provisioned by Microsoft.

Real keys are managed by Ops.

To reiterate, neither Google nor Yahoo require API keys.

External Requests
-----------------

Documented in [Issue 23](https://github.com/mozilla/browserid-bigtent/issues/23).

Monitoring
----------

### Version

During deployment you should create `static/ver.txt`.

This should have the last git commit and SHA as well as svn version. Example
contents:

    943d308 bump to 0.2012.04.27.5, and document changes in .4 and .5
    locale svn r105105
    =======
    >>>>>>> f48a5bc... Clean up docs

### Stats

BigTent has `statsd` prefixed to `bigtent` for the following:

Counters:

-   HTTP Requests at the start of a route
-   Things we log warnings on
-   Things we log errors on
-   [Things that make you go Hmmm](http://en.wikipedia.org/wiki/Things_That_Make_You_Go_Hmmm...)

Timers:

-   HTTP Requests amount of time spent servicing request

### Heartbeat

A heartbeat is available at `/__heartbeat__`.
