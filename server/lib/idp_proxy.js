exports.service = function (email) {
  if (typeof email !== 'string' || email.indexOf('@') < 0) {
    throw "Invalid email input to service function [" + email + "]" + (typeof email) + (email.indexOf('@'));
  }
  return email.split('@')[1];
};