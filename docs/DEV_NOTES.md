Developer Notes
===============

Prerequisites
-------------

1. Install [certifier](https://github.com/mozilla/browserid-certifier)

2. Copy the certifier's `key.publickey` file into `server/var/`.

3. Start certifier on it's default host and port

Setup
-----

While parts of BigTent can be run and tested independently of the core BrowserID
implementation, a full installation requires you to:

### Configure BigTent ###

1.  Add a local domain to your `/etc/hosts` or deploy BigTent to a server. For
    local development, `dev.bigtent.mozilla.org` works well as an aliased
    domain. Due to JSChannel and OAuth stuff, `localhost` itself won't work.

2.  Copy `server/config/local.json-dist` to `server/config/local.json`. Modify
    it by:

    -   Setting `use_https` to `true`
    -   Setting `issuer` to the domain you added to `/etc/hosts`

3.  Generate a self-signed SSL certificate:

        cd server/config
        openssl genrsa -out privatekey.pem 1024
        openssl req -new -key privatekey.pem -out certrequest.csr
        openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

4.  Install necessary Node modules with `npm install` in the root of your
    `browserid-bigtent` clone.

5.  Launch BigTent as root, so it can respond to HTTPS requests on port 443:
    `sudo ./server/bin/bigtent`. Bigtent will write logging data to
    `server/var/log/bigtent.log`.

6.  Visit your running instance (likely at https://dev.bigtent.mozilla.org)
    and accept the self-signed certificate.

### Configure BrowserID ###

1.  Check out the `dev` branch of `mozilla/browserid`.

2.  Edit `config/local.json` and add a new property, `proxy_idps`, with the URL of your BigTent instance. For example:

    "proxy_idps": {
        "gmail.com":   "dev.bigtent.mozilla.org",
        "yahoo.com":   "dev.bigtent.mozilla.org",
        "hotmail.com": "dev.bigtent.mozilla.org"
    },

3. Read the OPS_NOTES.md

4. Start BrowserID with `npm start`

You should now be able to visit your local BrowserID instance
(likely at http://127.0.0.1:10001) and attempt to log in with a
bigtent-supported email address.
