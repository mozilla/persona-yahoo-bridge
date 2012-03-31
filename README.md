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


* passport-google-oauth (OAuth 2)
** PROS
*** Clean Google page, name in upper right corner

    BigTent-dev is requesting permission to:

    View basic information about your account
    View your email address

    App Name (Learn More) -> Application Developer: email address
                             Clicking "Allow access" will redirect you to:
                             http://dev.bigtent.nutria.org:3030/auth/google/callback

And the data:
passport.use(new GoogleStrategy accessToken= ya29.AHES6ZQKMpsomebigstringF4CzY7xZ4 refreshToken= undefined profile= { provider: 'google',
  id: '11386bignumber971465',
  displayName: 'Austin King',
  name: { familyName: 'King', givenName: 'Austin' },
  emails: [ { value: 'austin.ok@gmail.com' } ],
  _raw: '{\n "id": "11386bignumber971465",\n "email": "austin.ok@gmail.com",\n "verified_email": true,\n "name": "Austin King",\n "given_name": "Austin",\n "family_name": "King",\n "link": "https://plus.google.com/11386bignumber971465",\n "picture": "https://lh3.googleusercontent.com/-e3CnclQOUi8/AAAAAAAAAAI/AAAAAAAABIE/hUngB3piACw/photo.jpg",\n "gender": "other",\n "locale": "en"\n}\n',
  _json:
   { id: '11386bignumber971465',
     email: 'austin.ok@gmail.com',
     verified_email: true,
     name: 'Austin King',
     given_name: 'Austin',
     family_name: 'King',
     link: 'https://plus.google.com/11386bignumber971465',
     picture: 'https://lh3.googleusercontent.com/-e3CnclQOUi8/AAAAAAAAAAI/AAAAAAAABIE/hUngB3piACw/photo.jpg',
     gender: 'other',
     locale: 'en' } }
passport.serializeUser user= { provider: 'google',
  id: '11386bignumber971465',
  displayName: 'Austin King',
  name: { familyName: 'King', givenName: 'Austin' },
  emails: [ { value: 'austin.ok@gmail.com' } ],
  _raw: '{\n "id": "11386bignumber971465",\n "email": "austin.ok@gmail.com",\n "verified_email": true,\n "name": "Austin King",\n "given_name": "Austin",\n "family_name": "King",\n "link": "https://plus.google.com/113860968276617971465",\n "picture": "https://lh3.googleusercontent.com/-e3CnclQOUi8/AAAAAAAAAAI/AAAAAAAABIE/hUngB3piACw/photo.jpg",\n "gender": "other",\n "locale": "en"\n}\n',
  _json:
   { id: '11386bignumber971465',
     email: 'austin.ok@gmail.com',
     verified_email: true,
     name: 'Austin King',
     given_name: 'Austin',
     family_name: 'King',
     link: 'https://plus.google.com/11386bignumber971465',
     picture: 'https://lh3.googleusercontent.com/-e3CnclQOUi8/AAAAAAAAAAI/AAAAAAAABIE/hUngB3piACw/photo.jpg',
     gender: 'other',
     locale: 'en' } }

** CONS
*** Need Product Logo, developer email address, callback url exposed to user in Learn More
*** [API Key](https://code.google.com/apis/console/?pli=1#project:49886215752:access)
*** dev.bigtent.nutria.org:3030/oauth2callback
* passport-oauth
* passport-google-oauth (OAuth 1)