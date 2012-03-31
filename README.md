# BigTent
Mozilla's Identity Provider Proxy Service

Goals
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
Gmail
* passport-google
** PROS
*** Remember this approval pre-checked
** Cons
***
  Google Accounts
  192.168.186.138 is asking for some information from your Google Account austin.ok@gmail.com
  Email address: Austin King (austin.ok@gmail.com)
  <Allow> <No Thanks>

passport.use(new GoogleStrategy identifier= https://www.google.com/accounts/o8/id?id=some-long-id profile= { displayName: 'Austin King',
  emails: [ { value: 'austin.ok@gmail.com' } ],
  name: { familyName: 'King', givenName: 'Austin' } }
passport.serializeUser user= { displayName: 'Austin King',
  emails: [ { value: 'austin.ok@gmail.com' } ],
  name: { familyName: 'King', givenName: 'Austin' },
  identifier: 'https://www.google.com/accounts/o8/id?id=some-long-id' }


* passport-google-oauth
* passport-oauth