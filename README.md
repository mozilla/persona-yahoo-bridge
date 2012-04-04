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
7) awsbox
8) Add statsd monitoring points


Gmail
* passport-google (OpenID)
* Used by imdb.com, flickr.com, imgur.com, huffingtonpost.com, cnet.com, stackoverflow.com, recipe.com,
** PROS
*** Remember this approval pre-checked
** Cons
*** Looks horrible compared to OAuth flow.
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

* Yahoo
** https://open.login.yahoo.com/openid/op/start?z=vVsEaQvQa9YGAGSLsAoGkFH_1tTo_Z46CIlJEzi_oGExbFjlaIKyyKfOUVtcx4fg4p6gVFNoSAM.zty8wz8TW10hAqFTO3jTamidLPY0YPpQwC6DSAqbZDbSioYfKPQQRmcKrKO1MYzO_NzNcCYnBDxCF87vtZB56z4zZhn20nxyV099PTZHNpGYDvNsrO1yODiXNYxxIr1Hycx95GUr_UtGB7L5Vx6ct.83upEUi9711MCkwuFwsvlztxNxaeWYgtcfwu.PVPWZRVCB9ZifTMomi5CRn6SuOFa.DGAnrm19USH2MN.cbaKVeIt7arQOPJe5S6keb8rfN_TC74g9sYvOwp5E4oZSVPlKcRl3RpMhTwlHatawbTIeCwew4iVfWx7he98mwoky0qegn5bEbc4EnLMHTv4ftcqUNiXL..GqEaxWCGJRwII2jAh3FjgDk3HlEJy7rIul0.g7fjG5kirXhlP4OCLT2Lrt00NLNnjyYrdtWDpsgOZoIngos3n.7WPGAKycxpT8rFJfY8juRCtQ7uPDqIBYXMyjeDCC8Snw1reL3he.ZH2zrmFhr2g1FgTbcG0ArlJMTiqVIW1rX6xxOzYoHuw2wAGOXcRe1II58efnmw4FDebNia4Igb3RLT9K2DYyBUry_gpjQUHpDJ5wPL6Pb4dAoFfG_EA-


* Hotmail
** huffingtonpost https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=11&ct=1333405586&rver=6.1.6208.0&wp=MBI_SSL&wreply=https:%2F%2Foauth.live.com%2Fauthorize%3Fscope%3Dwl.basic%252Cwl.contacts_emails%252Cwl.offline_access%26client_id%3D0000000048055028%26response_type%3Dcode%26redirect_uri%3Dhttp%253A%252F%252Fwww.huffingtonpost.com%252Fusers%252Fwinlive%252Fcallback.php%253Fprovider%253Dwinlive%26auth_redirect%3Dtrue&lc=1033&id=276649&popupui=1

== Thoughts on Profile Information ==
I think we should probably use OAuth to gather profile information that was missing from an OpenID exchange.
