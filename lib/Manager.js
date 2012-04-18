
var util = require('./util'),
	EventEmitter = process.EventEmitter;

var LinkedList = require('./LinkedList');

function Manager(options) {

	util.merger(this, options);

	this.map={};
	this.list=new LinkedList();

}


var proto=Manager.prototype;
proto.__proto__ = EventEmitter.prototype;


proto.addConn=function(conn){

	this.map[conn.id]=conn;
	this.list.addItem(conn);

}
proto.removeConn=function(conn){

	delete this.map[conn.id];
	this.list.removeItem(conn);
}

proto.getConn=function(id){
	return this.map[conn.id];
}

proto.getConnByIndex=function(idx){
	return this.list.getItemByIndex(idx);
}

proto.removeConnById=function(id){
	var conn=this.map[conn.id];
	delete this.map[id];
	this.list.removeItem(conn);
}

proto.forEach = function(fn){
	return this.list.forEach(fn);
}

module.exports=Manager;



