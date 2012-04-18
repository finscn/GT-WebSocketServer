
var util = require('./util'),
	EventEmitter = process.EventEmitter;

var http = require('http');

var Connection = require('./Connection');
var Manager = require('./Manager');


module.exports=Server;


function Server(options) {

	util.merger(this, options);

	this.rawServer = new http.Server();
	this.manager = new Manager({
		server : this
	});

	this.init();
	
}

var proto=Server.prototype;
proto.__proto__ = EventEmitter.prototype;


util.merger(proto, {
	port : 80,
	debug : false,

	init : function(){
		
		var self=this;

		// this.rawServer.on('connection' , function(socket){
		// 	//TODO
		// });

		this.rawServer.on('upgrade', function(req, socket, upgradeHead) {

			var upgrade = req.headers.upgrade;
			if (upgrade!==undefined && upgrade.toLowerCase() == 'websocket'){
				var options={
					request : req ,
					socket : socket,
					upgradeHead : upgradeHead,
					server : self,
					debug : self.debug
				}
				var conn=new Connection(options);
			}else{
				socket.end();
			}
		});

		this.rawServer.on('close' , function(socket){
			self.emit('close',socket );
		});

		this.rawServer.on('error' , function(e){
			self.emit('error', e );
		});
		
		this.rawServer.on('clientError' , function(e){
			self.emit('clientError', e );
		});

	},

	start : function(){
		this.rawServer.listen(this.port);
	},

	close : function(){
		this.manager.clear();
		this.rawServer.close();
	},

	send : function(id, data){
		var conn= this.manager.getConnection(id);
		conn.send(data);
	},

	broadcast : function(data){
		this.manager.forEach(function(conn){
			conn.send(data);
		});
	}

});






