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

Status
------
Not ready for production use!

Process
-------
1. (done) Auth via Google
2. (done) Maintain email address in session
3. (done) provision
4. (done) sign in
5. browserid.org whitelist
6. Multiple auths coexisting
7. (done) awsbox
8. Add statsd monitoring points
