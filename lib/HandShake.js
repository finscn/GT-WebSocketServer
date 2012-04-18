
var util = require('./util');

var crypto = require('crypto');


module.exports= HandShake;


function HandShake () {

}

HandShake.run=function(connection){
	var version=connection.version;
	var hs=HandShake.pool[version];
	if ( !hs ){
		hs=HandShake.pool['default'];
	}
	return hs(connection);
}



HandShake.getOrigin=function(connection) {
	var origin = connection.origin || '*';

	if (origin == '*' || Array.isArray(origin)) {
		origin = connection.request.headers.origin;
	}

	return origin;
}

HandShake.getLocation=function(connection) {
	if (connection.request.headers['host'] === undefined) {
		connection.reject('Missing host header');
		return null;
	}

	var location = '',
			secure = connection.socket.secure,
			host = connection.request.headers.host.split(':'),
			port = host[1] !== undefined ? host[1] : (secure ? 443 : 80);

	location += secure ? 'wss://' : 'ws://';
	location += host[0];

	if (!secure && port != 80 || secure && port != 443) {
		location += ':' + port;
	}

	location += connection.request.url;

	return location;
}

HandShake.MAGIC_NUM="258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

HandShake.pool={

	"draft76" : function(connection){

	 	var location = HandShake.getLocation(connection);
		if (location==null) {
			return false;
		}

		var upgradeHead=connection.upgradeHead;
		var res = 'HTTP/1.1 101 WebSocket Protocol Handshake\r\n' +
				'Upgrade: WebSocket\r\n' +
				'Connection: Upgrade\r\n' +
				'Sec-WebSocket-Origin: ' + HandShake.getOrigin(connection) + '\r\n' +
				'Sec-WebSocket-Location: ' + location;

		if (connection.subprotocol &&
				typeof connection.subprotocol == 'string') {
			res += '\r\nSec-WebSocket-Protocol: ' + connection.subprotocol;
		}

		var strkey1 = connection.request.headers['sec-websocket-key1'],
				spaces1 = strkey1.replace(/[^\ ]/g, '').length,
				numkey1 = parseInt(strkey1.replace(/[^\d]/g, ''), 10),

				strkey2 = connection.request.headers['sec-websocket-key2'],
				spaces2 = strkey2.replace(/[^\ ]/g, '').length,
				numkey2 = parseInt(strkey2.replace(/[^\d]/g, ''), 10);


		if (spaces1 == 0 || spaces2 == 0 ||
				numkey1 % spaces1 != 0 || numkey2 % spaces2 != 0) {
			connection.reject('WebSocket Handshake contained an invalid key');
		} else {
			var hash = crypto.createHash('md5'),
					key1 = util.pack(parseInt(numkey1 / spaces1)),
					key2 = util.pack(parseInt(numkey2 / spaces2));

			hash.update(key1);
			hash.update(key2);
			hash.update(upgradeHead.toString('binary'));

			res += '\r\n\r\n';
			res += hash.digest('binary');

			connection.socket.write(res, 'binary');
		}

		// connection.buffer = true;
		// connection.buffered = [];

		return true;

	},

	"13" : function(connection){
		var key = connection.request.headers['sec-websocket-key'];
		var shasum = crypto.createHash('sha1');	
		shasum.update(key + HandShake.MAGIC_NUM);
		key = shasum.digest('base64');

		var headers = [
			'HTTP/1.1 101 Switching Protocols'
			, 'Upgrade: websocket'
			, 'Connection: Upgrade'
			, 'Sec-WebSocket-Accept: ' + key
		];

		var socket=connection.socket;
		try {
			socket.write(headers.concat('', '').join('\r\n'));
			socket.setTimeout(0);
			socket.setNoDelay(true);
		} catch (e) {
			connection.close();
			return false;
		}

		return true;
	}

}

HandShake.pool['default']=HandShake.pool["13"];


