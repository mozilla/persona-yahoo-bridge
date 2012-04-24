# BigTent
A ProxyIdP service for bridging major IdPs who lack support for the BrowserID protocol.

# Goals
* Be promiscuous in bridging the top identity providers technologies
to work with the BrowserID protocol
* Support only the top N email providers in the world, so users
experience a Primary flow
* Encourage Companies to stand up a proper Primary

Q: How can I get Mozilla to add my service to the big tent?
A: Nope, please implement that BrowserID Primary protocol for your users

== Status ==
Not ready for produciton use!

== Process ==
x) Auth via Google
x) Maintain email address in session
x) provision
x) sign in
5) browserid.org whitelist
6) Multiple auths coexisting
x) awsbox
8) Add statsd monitoring points