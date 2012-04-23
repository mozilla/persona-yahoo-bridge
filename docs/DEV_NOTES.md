# Developer Notes #
## Setup ##

Add a local domain name to your /etc/hosts file or deploy to a server. Localhost won't work with jschannel stuff.

Copy etc/local.json-dist to etc/local.json.

Running BigTent without a web server...

This service **must** run on port 443. This is baked into the BrowserID Primary Protocol.

    cd etc
    openssl genrsa -out privatekey.pem 1024
    openssl req -new -key privatekey.pem -out certrequest.csr
    openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

## Start up

Use ``sudo clortho`` to run on port 443.