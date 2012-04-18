
var util = require('util');


var _util={

	merger : function(target, source,overwrite) {
		if (arguments.length<2 || source === undefined ) {
			source = target;
			target = {};
		}
		for ( var key in source) {
			if ( !(key in target) || overwrite!==false ) {
				target[key] = source[key];
			}
		}
		return target;
	},

	redirectEvent : function(sEmitter, sType, tEmitter, tType) {
		tType=tType||sType;
		sEmitter.addListener(sType, function() {
			var args=Array.prototype.slice.call(arguments);
			args.unshift(tType);
			tEmitter.emit.apply( tEmitter,args );
		});
	},

	pack : function(data) {
		var result = '';
		result += String.fromCharCode(data >> 24 & 0xFF);
		result += String.fromCharCode(data >> 16 & 0xFF);
		result += String.fromCharCode(data >> 8 & 0xFF);
		result += String.fromCharCode(data & 0xFF);
		return result;
	},

	unpack : function (buffer) {
		var n = 0;
		for (var i = 0; i < buffer.length; ++i) {
			n = (i == 0) ? buffer[i] : (n << 8) + buffer[i];
		}
		return n;
	},

	unmask : function (mask, buf, binary) {
		if (mask != null) {
			for (var i = 0, ll = buf.length; i < ll; i++) {
				buf[i] ^= mask[i % 4];
			} 
		}
		if (binary) return buf;
		return buf != null ? buf.toString('utf8') : '';
	}



}

_util.merger(util,_util);


module.exports=util;

