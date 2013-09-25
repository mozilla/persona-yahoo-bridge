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

    -   Setting `issuer` to the domain you added to `/etc/hosts`
    -   Make sure browserid_server matches where you will deploy BrowserID

3.  Install necessary Node modules with `npm install` in the root of your
    `browserid-bigtent` clone.

4.  Launch BigTent

    LOG_TO_CONSOLE=1 npm start

5.  Visit your running instance (likely at http://dev.bigtent.mozilla.org:3030/.well-known/browserid)

6. Copy your well known to the filesystem

    curl http://dev.bigtent.mozilla.org:3030/.well-known/browserid > some/path/bigtent_well_known

### Configure BrowserID ###

1.  Check out the `dev` branch of `mozilla/browserid`.

2.  Edit `config/local.json` and add a new property, `proxy_idps`, with the URL of your BigTent instance. For example:

    "proxy_idps": {
        "yahoo.com":   "dev.bigtent.mozilla.org"
    },

3. Read the OPS_NOTES.md in this repo

4. Start BrowserID with `npm start` with SHIMMED_PRIMARIES set

Example:

    SHIMMED_PRIMARIES="dev.bigtent.mozilla.org|http://dev.bigtent.mozilla.org:3030|/home/ozten/bigtentkey"  npm start

You should now be able to visit your local BrowserID instance
(likely at http://127.0.0.1:10001) and attempt to log in with a
bigtent-supported email address.
