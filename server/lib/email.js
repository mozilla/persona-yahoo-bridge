/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('underscore'),
config = require('./configuration.js'),
ejs = require('ejs'),
emailer = require('nodemailer'),
fs = require('fs'),
logger = require('./logging.js').logger,
path = require('path'),
statsd = require('./statsd'),
url = require('url');

/* if smtp parameters are configured, use them */
try { var smtp_params = config.get('smtp'); } catch(e) {}
if (smtp_params && smtp_params.host) {
  emailer.SMTP = {
    host: smtp_params.host,
    port: smtp_params.port
  };
  logger.info("delivering email via SMTP host: " +  emailer.SMTP.host);
  if (smtp_params.user) {
    emailer.SMTP.use_authentication = true;
    emailer.SMTP.user = smtp_params.user;
    emailer.SMTP.pass = smtp_params.pass;

    logger.info("authenticating to email host as " +  emailer.SMTP.user);
  }
}

const TEMPLATE_PATH = path.join(__dirname, "..", "views", "email_templates");

// Templates are compiled once, on the first request. Then they are cached.
var templates;
var compiled = false;
function compileTemplates() {
  // This exists only as a hook for extracting strings with extract-pot
  // At runtime, locale specific gettext will be used in doSend
  var gettext = function(a) { return a; }
  if (false === compiled) {
    compiled = true;

    // a map of all the different emails we send
    templates = {
      "link_accounts": {
        landing: 'link_accounts',
        subject: gettext("Confirm email address for Persona"),
        template: fs.readFileSync(path.join(TEMPLATE_PATH, 'link_accounts.ejs'))
      }
    };

    // now turn file contents into compiled templates
    Object.keys(templates).forEach(function(type) {
      var tmpl = templates[type].template.toString();
      templates[type].template = ejs.compile(tmpl);
    });
  }
}

//TODO send in localeContext
function doSend(email_type, email, context, langContext) {
  compileTemplates();

  if (!templates[email_type]) {
    throw new Error("unknown email type: " + email_type);
  }

  var email_params = templates[email_type];

  var public_url = config.get('public_url') + "/" +
          email_params.landing + "?token=" + encodeURIComponent(context.secret),
      GETTEXT = langContext.gettext,
      format = langContext.format;

  if (config.get('email_to_console')) {
    console.log("\nVERIFICATION URL:\n" + public_url + "\n");
  } else {
    var templateArgs = _.extend({
      link: public_url,
      gettext: GETTEXT,
      format: format
    }, context);

    var mailOpts = {
      sender: "Persona <no-reply@persona.org>",
      to: email,
      // Note: everytime at runtime we get the appropriate
      // localized string for the subject
      subject: GETTEXT(email_params.subject),
      text: email_params.template(templateArgs),
      headers: {
        'X-BrowserID-VerificationURL': public_url
      }
    };

    emailer.send_mail(mailOpts, function(err, success) {
      if (!success) {
        logger.error("error sending email to: " + email + " - " + err);
        statsd.increment('email.' + email_type + '.sent.error');
      }
    });
  }
}

exports.sendLinkAccounts = function(email, msgContext, langContext) {
  doSend('link_accounts', email, msgContext, langContext);
};
