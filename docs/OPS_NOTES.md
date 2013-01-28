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

BigTent must have a public key, and it must be identical to the one used by
the associated BrowserID Certifier. There are several ways to achieve this:

-   Place the JSON-serialized contents of the public key in the `PUBLIC_KEY`
    environment variable.
-   Place your `key.publickey` file in BigTent's `server/var/` directory.
-   Edit your config file and set `pubkey_path` to the location of the
    `key.publickey` file.
-   Do nothing and let the server generate its own "ephemeral keys," which will
    change on each restart.

In practice, you'll want stable keys that match your certifier.

Keys can be generated with `./node_modules/jwcrypto/bin/generate-keypair`.

Configs
-------

A sample config file `server/config/local.json-dist` is provided and must be copied
and customized to run the server. You can name this anything and use `CONFIG_FILES`
to control, just like BrowserID.

### HTTP Proxy Config
In stage and production, we limit outbound http and https requests by using a
squid proxy. This can be controlled two ways:

1) Config
    {
        "http_proxy": { "port": 1234, "host": "localhost" }
    }

2) Environment Variables

    HTTP_PROXY=localhost:1234

Both of these are identical to BrowserID. If either of these are set...
BigTent will alter the environment variables to add the following:

  * HTTP_PROXY_HOST
  * HTTP_PROXY_PORT
  * HTTPS_PROXY_HOST
  * HTTPS_PROXY_PORT

These are used by lower level libraries during OpenID and OAuth flows.

Per Service Deployment
----------------------

It is important to defence in depth, that we only deploy yahoo code to a
yahoo bigtent instance and gmail code to a gmail instance, etc.

It should be an error if a gmail user were to somehow try to do OpenID
via a yahoo BigTent instance.

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
