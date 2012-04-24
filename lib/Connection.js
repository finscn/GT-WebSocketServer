
var util = require('./util'),
	EventEmitter = process.EventEmitter;


var Parser = require('./Parser'),
	HandShake = require('./HandShake'),
	Writer = require('./Writer');



module.exports=Connection;


function Connection(options) {

	util.merger(this, options);

	this.id=Connection.createId(this.socket);

	this.init();
}

Connection._counter=0;
Connection.createId = function(socket) {
	return process.pid + '' + socket.remotePort + '' + (++Connection._counter);
};

var proto=Connection.prototype;
proto.__proto__ = EventEmitter.prototype;


util.merger(proto, {
	version : null,

	debug : false,

	opened : false,
	init : function(){

		var headers=this.request.headers;
		var ver=headers["sec-websocket-version"];

		if (ver){
			this.version=ver;
		}else if (headers['sec-websocket-key1'] &&
			headers['sec-websocket-key2']) {
			this.version='draft76';
		}

		this.parser=Parser.create({
				version : this.version,
				connection : this
			});

		this.write=Writer.get(this);

		var rs=this.handshake();

		if (rs){
			var self=this;

			this.parser.on('data',function(message){
				console.log(message)
				self.emit("message", message);
			});

			this.socket.on("end",function(){
				console.log("end");
				self.close();
			});

			this.socket.on("close",function(){
				console.log("close")
				//self.close();
			});

			this.opened=true;
			
			this.server.manager.addConnection(this);

			this.server.emit("connection",this);

			
		}
	},

	write : null,

	send : function(data){
		if (this.opened){
			this.write(data);
		}
	},

	close : function(){
		if (this.opened){
			
			this.emit("close", this);

			this.socket.end();
			this.socket.destroy();
			this.opened=false;

			this.server.manager.removeConnection(this);
		}
	},

	reject : function(reason){
		console.log(reason);
		this.close();
	},

	handshake : function(){

		var rs=HandShake.run(this);
		if (rs){
			var self=this;
			this.socket.on('data', function (data) {
				self.parser.add(data);
			});			
		}


		return rs;
	}
});



