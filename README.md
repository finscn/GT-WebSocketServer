GT-WebSocketServer -- A NodeJS WebSocket Server  ( Pure Javascript )
=========================

GT-WebSocketServer 是一个基于NodeJS (使用纯javascripte语言) 实现的 WebSocket Server.
其实类似的项目网上已经有了一些, 但是它们要么过于强大和复杂(如 Socket.IO), 要么不能支持比较新的协议(如 node-websocket-server),要么不是纯js实现(如 Webocket-node, 当然这没什么不好).
由于我本人平时经常会用到一些websocket, 所以特别需要一个轻量级的 单纯的websocket server, 但显然目前现有的项目都不符合我的需求, 于是自己写了一个.

这个项目重的代码 参考了一些网上已有的开源项目(但绝对不是直接拷贝粘贴), 在这里对就不一一感谢各位有开源精神的大牛了.

这个项目我会继续完善下去, 不过暂时目标不会很大,"高性能 高负载 高可靠 高安全"短期内也不会是我的努力方向.简单易用够灵活 才是我追求的. 另外, **本项目目前没有做安全性保证** 


**目前只支持 websocket协议的 草案76 和 13** .
这两个版本也是目前被使用最广的版本. 例如 chrome firefox最新版支持草案13, safari 支持草案76.

同时 76也兼容75 , 13也兼容16 17.



示例
-----------------
下面举一个 简单的WebSocket Server 例子 (也是本项目test下的测试用例)
 


	var Server = require('./lib/Server');

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

	


更多示例和文档 稍后奉上
--------------------



