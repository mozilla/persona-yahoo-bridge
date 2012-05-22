# Developer Notes #
## Setup ##

### BigTent

Add a local domain name to your /etc/hosts file or deploy to a server. Localhost won't work with jschannel stuff. Example: dev.bigtent.mozilla.org

Copy server/config/local.json-dist to server/config/local.json.

In server/config/local.json:

- change `use_https` to `true`
- change `issuer` to the domain you added to `/etc/hosts`

Running BigTent directly under Node (without a web server)...

This service **must** run on port 443. This is baked into the BrowserID Primary Protocol.

    cd server/config
    openssl genrsa -out privatekey.pem 1024
    openssl req -new -key privatekey.pem -out certrequest.csr
    openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

### BrowserID
Check out bigtent branch of mozilla/browserid.

In your browserid server, add this to your local.json:

    "bigtent_url": "https://dev.bigtent.mozilla.org",

## Start up

Use ``sudo ./server/bin/bigtent``

tail server/var/log/bigtent.log

in browser hit https://dev.bigtent.mozilla.org (or whatever your hostname is)
