Authorization Notes
===================

This document is largely out of date. Primary used for researching and planning
the addition of new Identity providers.

Gmail
-----

Two options: OpenID (via `passport-google`) and OAuth2 (via
`passport-google-oauth`).

OpenID is used at IMDB, Flickr, Imgur, Huffington Post, CNET, Stack Overflow,
and Recipe.com, amongst others. Both Gigya and Janrain use OpenID on their
social login products.

The OAuth2 flow is slightly more visually appealing, but requires additional
administrative overhead: we have to register and maintain an account with
Google, request API keys, and provide a site logo and a "developer email
address" that are displayed to users. Each API key is only usable by a
specified domain, requiring several keys for testing. The callback URL is
exposed to the user, perhaps leading to confusion.

Google provides no safe way to hint as to what address we want the user to log
in as. While the OAuth2 endpoint accepts an email address in the "user_id"
parameter, it strands the user at a Google-hosted error page if the user is
signed in to Google, but not under the supplied account.

Thus, we're sticking with the OpenID flow.

For more information, see:

-   https://developers.google.com/accounts/docs/OpenID
-   https://github.com/jaredhanson/passport-google

Yahoo
-----

Yahoo supports OpenID and the node community has `passport-yahoo`, which works well.

Yahoo's preferred auth mechanism is a OpenID/OAuth 2 hybrid.

A third option is OAuth.

We're launching with OpenID.

For more information, see:

-   http://developer.yahoo.com/openid/
-   https://github.com/jaredhanson/passport-yahoo

Windows Live (Hotmail)
----------------------

Microsoft only supports OAuth2 (`passport-windowslive`), and not OpenID. We're
only enabling BigTent support for addresses at `hotmail.com`, not `live.com`
or any of the country-specific TLDs.

Since we only want a user's email address, we're only requesting the
`wl.emails` scope. This returns an object with properties representing the
user's `preferred`, `account`, `personal`, and `business` email addresses.

We have to register and maintain an account to obtain API keys. These are
being handled by Services Ops. For development, keys can be obtained at
https://manage.dev.live.com/.

For more information, see:

-   http://dev.live.com/
-   http://isdk.dev.live.com/ISDK.aspx?category=scenarioGroup_identity_profiles&index=0
-   http://msdn.microsoft.com/en-us/library/live/hh826528.aspx
-   https://github.com/jaredhanson/passport-windowslive
