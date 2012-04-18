
var Server = require('../lib/Server');

var _port=process.argv[2]||8088;


var server=new Server({
	id : "test_server_1",
	port : _port
})

server.on("connection", function(conn){
	
	console.log("Connection: "+conn.id+" ver:"+conn.version);

	conn.on("message",function(message){
		console.log("message from "+conn.id+" : "+message)
		server.broadcast(message);
	});

	conn.on("close", function(conn){
		console.log("close : "+conn.id);
		server.broadcast(conn.id+" has closed.");
	});

});


server.on('error', function (e) {
	console.log("exception: " + e);
	server.broadcast("Server has an error.");
});






server.start();
console.log("Server Started. port : "+server.port);
