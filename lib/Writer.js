
var util = require('./util');

module.exports= Writer;


function Writer() {

}

Writer.get=function(connection){
	var version=connection.version;
	var w = Writer.pool[version];
 	if (!w){
 		w=Writer.pool["default"];
 	}
 	return w;
}


Writer.pool={
	"draft76" : function(data){

		var cnnection=this;

		var length = Buffer.byteLength(data)
			, buffer = new Buffer(2 + length);

		buffer.write('\x00', 'binary');
		buffer.write(data, 1, 'utf8');
		buffer.write('\xff', 1 + length, 'binary');

		cnnection.socket.write(buffer);
	},

	"13" : function(data){
		var cnnection=this;

		var opcode=0x81;
		var dataBuffer = new Buffer(data)
			, dataLength = dataBuffer.length
			, startOffset = 2
			, secondByte = dataLength;
		if (dataLength > 65536) {
			startOffset = 10;
			secondByte = 127;
		}
		else if (dataLength > 125) {
			startOffset = 4;
			secondByte = 126;
		}
		var outputBuffer = new Buffer(dataLength + startOffset);
		outputBuffer[0] = opcode;
		outputBuffer[1] = secondByte;
		dataBuffer.copy(outputBuffer, startOffset);

		if (secondByte==126){
			outputBuffer[2] = dataLength >>> 8;
			outputBuffer[3] = dataLength % 256;
		}else if(secondByte==127){
			var l = dataLength;
			for (var i = 1; i <= 8; ++i) {
				outputBuffer[startOffset - i] = l & 0xff;
				l >>>= 8;
			}
		}

		cnnection.socket.write(outputBuffer, 'binary');
	}


}
Writer.pool['default']=Writer.pool["13"];

