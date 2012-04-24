
var util = require('./util'),
	EventEmitter = process.EventEmitter;

module.exports=Parser;


function Parser () {

}

Parser.create=function(options){
	options=options||{};
	var version=options.version||"default";

	var P=Parser.pool[version]||Parser.pool["default"];

	return new P(options);
}

Parser.pool={};


var _Parser;


_Parser=function(options) {

	util.merger(this, options);

	this.state = {};

	this.init();
};

var proto=_Parser.prototype;
proto.__proto__ = EventEmitter.prototype;


util.merger(proto, {

	init : function(){

		var self = this;

		this.reset();

		this.opcodeHandlers = {
			// text
			'1': function(data) {
				var finish = function(mask, data) {

					self.currentMessage += util.unmask(mask, data);
					if (self.state.lastFragment) {

						self.connection.emit('message', self.currentMessage);
						self.currentMessage = '';

					}
					self.endPacket();
				}

				var expectData = function(length) {
					if (self.state.masked) {
						self.expect('Mask', 4, function(data) {
							var mask = data;
							self.expect('Data', length, function(data) {
								finish(mask, data);
							});
						});
					}
					else {
						self.expect('Data', length, function(data) { 
							finish(null, data);
						});
					} 
				}

				// decode length
				var firstLength = data[1] & 0x7f;
				if (firstLength < 126) {
					expectData(firstLength);
				}
				else if (firstLength == 126) {
					self.expect('Length', 2, function(data) {
						expectData(util.unpack(data));
					});
				}
				else if (firstLength == 127) {
					self.expect('Length', 8, function(data) {
						if (util.unpack(data.slice(0, 4)) != 0) {
							self.error('packets with length spanning more than 32 bit is currently not supported');
							return;
						}
						var lengthBytes = data.slice(4); // note: cap to 32 bit length
						expectData(util.unpack(data));
					});
				}	 
			},

			// close
			'8': function(data) {
				self.reset();
				self.connection.close();
			}
		}

		this.expect('Opcode', 2, this.processPacket); 

	},

	reset : function() {

		this.state.activeFragmentedOperation = null;
		this.state.lastFragment = false;
		this.state.masked = false;
		this.state.opcode = 0;

		this.expectOffset = 0;
		this.expectBuffer = null;
		this.expectHandler = null;
		this.overflow = null;
		this.currentMessage = '';

	},


	add : function(data) {
		if (this.expectBuffer == null) {
			this.addToOverflow(data);
			return;
		}
		var toRead = Math.min(data.length, this.expectBuffer.length - this.expectOffset);
		data.copy(this.expectBuffer, this.expectOffset, 0, toRead);
		this.expectOffset += toRead;
		if (toRead < data.length) {
			this.overflow = new Buffer(data.length - toRead);
			data.copy(this.overflow, 0, toRead, toRead + this.overflow.length);
		}
		if (this.expectOffset == this.expectBuffer.length) {
			var bufferForHandler = this.expectBuffer;
			this.expectBuffer = null;
			this.expectOffset = 0;
			this.expectHandler(bufferForHandler);
		}
	},


	expect : function(what, length, handler) {
		this.expectBuffer = new Buffer(length);
		this.expectOffset = 0;
		this.expectHandler = handler;
		if (this.overflow != null) {
			var toOverflow = this.overflow;
			this.overflow = null;
			this.add(toOverflow);
		}
	},


	addToOverflow : function(data) {
		if (this.overflow == null) {
			this.overflow = data;
		}else{
			var prevOverflow = this.overflow;
			this.overflow = new Buffer(this.overflow.length + data.length);
			prevOverflow.copy(this.overflow, 0);
			data.copy(this.overflow, prevOverflow.length);
		} 
	},


	processPacket : function (data) {
		if ((data[0] & 0x70) != 0) {
			this.error('reserved fields must be empty');
			return;
		} 
		this.state.lastFragment = (data[0] & 0x80) == 0x80; 
		this.state.masked = (data[1] & 0x80) == 0x80;
		var opcode = data[0] & 0xf;
		if (opcode == 0) { 
			// continuation frame
			this.state.opcode = this.state.activeFragmentedOperation;
			if (!(this.state.opcode == 1 || this.state.opcode == 2)) {
				this.error('continuation frame cannot follow current opcode')
				return;
			}
		}else {		
			this.state.opcode = opcode;
			if (this.state.lastFragment === false) {
					this.state.activeFragmentedOperation = opcode;
			}
		}
		var handler = this.opcodeHandlers[this.state.opcode];
		if (typeof handler == 'undefined') this.error('no handler for opcode ' + this.state.opcode);
		else handler(data);
	},


	endPacket : function() {
		this.expectOffset = 0;
		this.expectBuffer = null;
		this.expectHandler = null;
		if (this.state.lastFragment && this.state.opcode == this.state.activeFragmentedOperation) {
			// end current fragmented operation
			this.state.activeFragmentedOperation = null;
		}
		this.state.lastFragment = false;
		this.state.opcode = this.state.activeFragmentedOperation != null ? this.state.activeFragmentedOperation : 0;
		this.state.masked = false;
		this.expect('Opcode', 2, this.processPacket); 
	},

	error : function (reason) {
		this.reset();
		this.connection.emit('error', new Error(reason) );
		return this;
	}


});

Parser.pool["13"]=_Parser;



//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


_Parser = function(options) {

	util.merger(this, options);

	this.init();
};

var proto=_Parser.prototype;
proto.__proto__ = EventEmitter.prototype;


util.merger(proto, {

	init : function(){

		this.reset();
	},

	reset : function(){
		this.buffer = '';
		this.i = 0;
	},

	add : function (data) {
		this.buffer += data;
		this.parse();
	},

	parse : function () {

		for (var i = this.i, chr, l = this.buffer.length; i < l; i++){
			chr = this.buffer[i];

			if (this.buffer.length == 2 && this.buffer[1] == '\u0000') {
				this.connection.emit('close');
				this.buffer = '';
				this.i = 0;
				return;
			}

			if (i === 0) {
				if (chr != '\u0000') {
					this.error('Bad framing. Expected null byte as first frame');
				} else {
					continue;
				}
			}

			if (chr == '\ufffd') {
				this.connection.emit('message', this.buffer.substr(1, i - 1));
				this.buffer = this.buffer.substr(i + 1);
				this.i = 0;
				return this.parse();
			}
		}


	},

	error : function (reason) {
		this.reset();
		this.connection.emit('error', new Error(reason) );
		return this;
	}

});

Parser.pool["draft76"]=_Parser;



Parser.pool["default"]=Parser.pool["13"];

