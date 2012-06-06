BigTent
=======
A ProxyIdP service for bridging major IdPs who lack support for the BrowserID protocol.

Goals
-----
* Be promiscuous in bridging the top identity providers technologies
to work with the BrowserID protocol
* Support only the top N email providers in the world, so users
experience a Primary flow
* Encourage Companies to stand up a proper Primary

Q: How can I get Mozilla to add my service to the big tent?

A: Nope, please implement that BrowserID Primary protocol for your users

Dependencies
------------

* This project reuses a [certifier](https://github.com/mozilla/browserid-certifier) server

Status
------
Not ready for production use!
