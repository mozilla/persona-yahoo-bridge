var algorithm = "DH-SHA256";

const
bigint = require('./openid/lib/bigint.js'),
convert = require('./openid/lib/convert.js'),
openid = require('./openid/openid.js');

var _toBase64 = function(bigint)
{
  return convert.base64.encode(convert.btwoc(convert.chars_from_hex(bigint.toString(16))));
}

var _fromBase64 = function(str)
{
  return new bigint.BigInteger(convert.hex_from_chars(convert.unbtwoc(convert.base64.decode(str))), 16);
}

var _xor = function(a, b)
{
  if(a.length != b.length)
  {
    throw new Error('Length must match for xor');
  }

  var r = '';
  for(var i = 0; i < a.length; ++i)
  {
    r += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
  }

  return r;
}

var _generateDiffieHellmanParameters = function(algorithm)
{
  var defaultParams = {};
  // p and g are same as our load test
  defaultParams.p = 'ANz5OguIOXLsDhmYmsWizjEOHTdxfo2Vcbt2I3MYZuYe91ouJ4mLBX+YkcLiemOcPym2CBRYHNOyyjmG0mg3BVd9RcLn5S3IHHoXGHblzqdLFEi/368Ygo79JRnxTkXjgmY0rxlJ5bU1zIKaSDuKdiI+XUkKJX8Fvf8W8vsixYOr';
  defaultParams.g = 'Ag==';

  var p = _fromBase64(defaultParams.p);
  var g = _fromBase64(defaultParams.g);
  var a = null;

  if(algorithm == 'DH-SHA1')
  {
    a = new bigint.BigInteger(160, 1, new bigint.SecureRandom());
  }
  else
  {
    a = new bigint.BigInteger(256, 1, new bigint.SecureRandom());
  }

  var j = g.modPow(a, p);
  return { p: _toBase64(p),
    g: _toBase64(g),
    a: _toBase64(a),
    j: _toBase64(j) };
}
// https://openid.net/specs/openid-authentication-2_0.html#assoc_sess_types
// We need to do 8.4.2 DH-SHA256
exports.associate_session = function () {
  var dh = _generateDiffieHellmanParameters(algorithm);
  convert.base64.encode(_xor, encMacKey, p);
  return ???;
}
