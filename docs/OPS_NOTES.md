# Operations Notes #

BigTent is a IdP Proxy service. It bridges gmail.com, yahoo.com, and hotmail.com email addresses so that they look like Google, Yahoo, and Microsoft are running BrowserID Primary enabled servers.

In Practise, this server **looks like a primary**!

Although it has a ``/.well-known/browserid`` file, _only the ``public-key`` field is used_. The [BrowserID codebase](https://github.com/mozilla/browserid) has the provisioning and authentnication urls hardcoded into it's configs.

## Windows Live API Key
Most IdPs we proxy use OpenID, but Windows Live requires an API Key. This means two things - domain name and API key must match, API key must be registred with Microsoft. Real keys are managed by Ops.

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