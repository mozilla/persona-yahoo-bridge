# Operations Notes #

BigTent is a IdP Proxy service. It bridges gmail.com, yahoo.com, and hotmail.com email addresses so that they look like Google, Yahoo, and Microsoft are running BrowserID Primary enabled servers.

In Practise, this server **looks like a primary**!

Although it has a ``/.well-known/browserid`` file, _only the ``public-key`` field is used_. The [BrowserID codebase](https://github.com/mozilla/browserid) has the provisioning and authentnication urls hardcoded into it's configs.

## External Requests
BigTent current does not make any http or https requests to external resources.