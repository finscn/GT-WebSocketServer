
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


proto.addConnection=function(connection){

	this.map[connection.id]=connection;
	this.list.addItem(connection);

}
proto.removeConnection=function(connection){

	this.list.removeItem(connection);
	delete this.map[connection.id];
}

proto.getConnection=function(id){
	return this.map[id];
}

proto.getConnectionByIndex=function(index){
	return this.list.getItemByIndex(index);
}

proto.removeConnectionById=function(id){
	var connection=this.map[id];
	this.list.removeItem(connection);
	delete this.map[id];
}

proto.forEach = function(fn){
	return this.list.forEach(fn);
}

module.exports=Manager;



