# AWS Deployment with awsbox

Make sure you have persona_secrets.

    ./node_modules/.bin/awsbox -h

## One time step

    $ ssh app@yourvm.personatest.org
    $ git clone https://github.com/mozilla/browserid-certifier.git
    $ cd browserid-certifier
    $ npm install
    $ cp config/local.json-dist config/local.json
    $ emacs config/local.json

Change port to `8081`, change `issuer_hostname` to `yourvm.personatest.org`

    $ mkdir var
    $ cd var
    $ ../node_modules/.bin/generate-keypair
    $ CONFIG_FILES=/home/app/browserid-certifier/config/local.json nohup node bin/certifier > var/certifier.log &

The certifier is now setup. Each time you `git push` the post deploy hook will fixup your public key.

## Deploying...

    $ git push yourvm HEAD:master
