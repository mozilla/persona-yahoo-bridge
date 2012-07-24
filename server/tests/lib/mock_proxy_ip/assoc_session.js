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
exports.associate_session = function (dhConsumerPublic) {

  // Stable for Google load
  var openid_dh_modulus = 'ANz5OguIOXLsDhmYmsWizjEOHTdxfo2Vcbt2I3MYZuYe91ouJ4mLBX%2BYkcLiemOcPym2CBRYHNOyyjmG0mg3BVd9RcLn5S3IHHoXGHblzqdLFEi%2F368Ygo79JRnxTkXjgmY0rxlJ5bU1zIKaSDuKdiI%2BXUkKJX8Fvf8W8vsixYOr';

  // 1 assoc_handle
  // A random 32 char string
  var _assoc_handle = '012345678901234567890123456789cc';
  // Line 294 Openid.class.php
    var _openid_dh_modulus = false; // convert.base64.decode(openid_dh_modulus);
    console.log('_openid_dh_modulus=', _openid_dh_modulus);

  // 2 openid_dh_modules
  // 3 openid_dh_gen
  // 4 dh_server_public
  // 5 enc_mac_key
  // 6 update session
  var dh = _generateDiffieHellmanParameters(algorithm);
  
    if (true) {
	return 'foo';
    }
  // mine
//_xor, encMacKey, p);
  return convert.base64.encode(convert.btwoc(openid_dh_gen.modPow(secret, openid_dh_modules)));
// _toBase64
  return convert.base64.encode(convert.btwoc(convert.chars_from_hex(bigint.toString(16))));
   // php
  //return base64_encode($this->btwocEncode(bcpowmod($this->_openid_dh_gen, $secret_key, $this->_openid_dh_modulus));)
}
