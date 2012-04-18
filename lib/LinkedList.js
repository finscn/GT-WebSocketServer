
var util = require('./util');

module.exports=LinkedList;


function LinkedList(){
	this.head={};
	this.tail={};
	this.clear();
};

var proto=LinkedList.prototype;

util.merger(proto,{

	length : 0,

	clear : function(){
		this.head._next=this.tail;
		this.tail._prev=this.head;
		this.length=0;
	},

	addItem : function(item){
       	item._prev = this.tail._prev;
        item._next = this.tail;
        item._prev._next = this.tail._prev = item;
		this.length++;
	},

	removeItem: function(item){
		 item._prev._next = item._next;
         item._next._prev = item._prev;
         item._next = item._prev = null;
         this.length--;
	},

	isHead : function(item){
		return item===this.head;
	},
	
	isTail : function(item){
		return item===this.tail;
	},

	first : function(){
		return this.head._next;
	},
	last : function(){
		return this.tail._prev;
	},

	isFirst : function(item){
		return item==this.first();
	},
	isLast : function(item){
		return item==this.last();
	},
	circle : function(){
		this.last()._next=this.first();
	},
	uncircle : function(){
		this.last()._next=this.tail;
	},

	getItemByIndex : function(index){
		index||0;
		var item=this.first();
		for (i=0;i<index;i++){
			item=item._next;
		}
		return item;
	},
	
	forEach : function(fn){
		var rsList=[];
		var item=this.head;
		for (var i=0,len=this.length;i<len;i++){
			item=item._next;
			if (item==null){
				break;
			}
			var rs=fn(item,i,this);
			rsList.push(rs);
			if (rs===false){
				break;
			}
		}
		return rsList;
	}
});


