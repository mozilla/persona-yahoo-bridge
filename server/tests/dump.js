// Dump request and response onto filesystem
var fs = require('fs');

exports.dump = function (method, options, body) {
  var dir = '/tmp/bigtent/' + options.host,
      time = new Date().getTime(),
      opts = {
          host: options.host,
	  port: options.port,
	  path: options.path
      };

    console.log(opts);

    return function (res, data) {
      fs.mkdir(dir);
      fs.writeFileSync(dir + '/' + time,
		       'REQUEST: ' + method + ' \n' + 
		       JSON.stringify(opts, null, 4) + 
		       '\nBODY:\n' + body + '\n' +
		       '\nRESPONSE ' + res.statusCode +
		       '\nHEADERS:\n' + 
		       JSON.stringify(res.headers, null, 4) + 
		       '\nBODY\n\n' + data.toString('utf8'),
		       'utf8');
    };

};