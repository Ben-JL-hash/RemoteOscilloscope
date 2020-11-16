
const http = require('http');
const WebSocketServer = require('websocket').server;
const fs = require('fs');

var sampAmount = 177

var Constants = {
    apmitude:200,
    height:400
}

const remainder = x => y => x % y
const quotient  = x => y => Math.floor(x/y);
function getData(number, samples){
	const newnum = remainder(number)(200);
	const filenum = quotient(newnum)(2) + 1;
    const half = remainder(newnum)(2);
    let str = filenum.toString().padStart(3, "0")

	var path = __dirname +"/Datasets/Z/Z"+str+".txt";
	var lines = fs.readFileSync(path, 'utf-8')
    .split('\r\n').map(x=>parseInt(x)+Constants.apmitude)
    start = 0
	return lines.slice(start,start+samples)
}
//////////////////////////////////////////////////////////////////////
function getData(number, samples,gain){
    const sizeofFile = 4096;
    const totSamplesperFile = Math.floor(quotient(sizeofFile)(samples))
    const totSamples = totSamplesperFile*100
    //sample section
    const newnum = remainder(number)(totSamples);
    const filenum = quotient(newnum)(totSamplesperFile) + 1;
    const sampnum = remainder(newnum)(totSamplesperFile);
    let str = filenum.toString().padStart(3, "0")

	var path = __dirname +"/Datasets/Z/Z"+str+".txt";
	var lines = fs.readFileSync(path, 'utf-8')
    .split('\r\n').map(x=>parseInt(x)*gain +Constants.height)
    start = sampnum*samples
	return lines.slice(start,start+samples)
}
//////////////////////////////////////////////////////////////////////////
let path = __dirname +"/Datasets/ECGData.txt";
var ECGData = fs.readFileSync(path, 'utf-8').split('\r\n').map(x=>parseFloat(x)*100);

function getECG(number,samples,gain){
    const sizeofFile = ECGData.length;
    const totSamplesperFile  =  Math.floor(quotient(sizeofFile)(samples));
    const sampnum = remainder(number)(totSamplesperFile);
    start = sampnum*samples
    const newData = ECGData.slice(start, start+samples);
    return newData.map(x=> parseInt(x*gain) + Constants.height)

}
var ECGLive  = getECG(1,1920,1);


////////////////////////////////////////////////////////////////////////
var data = getData(0,sampAmount,1);

var pi = Math.PI;
var sin = Math.sin;
var sinData = [];
var sinOriginal = [];
for (let i=1;i<=1920;i++){
    let n = sin((pi*i)/480)
    sinOriginal.push(n);
    sinData.push(n);
}
function nextSinData(list){
    return list.slice(1).concat(list[0]);
}
function prepareSinValues(list,gain){
    return list.map(x=> x*Constants.apmitude*gain).map(x=>Math.round(x)).map(x=>x+Constants.height)
}



const server = http.createServer();
server.listen(8081);
const wsServer = new WebSocketServer({
    httpServer: server
});
wsServer.on('request', function(request) {
    const connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
        var string = message.utf8Data;
		var stringList = string.split(',');
        var valList = stringList.map(x=> parseFloat(x));
        
        console.log('Received Message:', message.utf8Data);
        /*
        var arr16 = new Uint16Array(dataList);
        var buffer = new Buffer.from(arr16.buffer)
        connection.sendBytes(buffer);
        dataList = nextData(dataList);
        */
       if(valList[1] === 0){
           //eeg
            var arr16 = new Uint16Array(data);
            var buffer = new Buffer.from(arr16.buffer)
            connection.sendBytes(buffer);
            data = getData(valList[0],sampAmount,valList[2]);
       }
       else if(valList[1] === 1){
        var arr16 = new Uint16Array(ECGLive);
        var buffer = new Buffer.from(arr16.buffer)
        connection.sendBytes(buffer);
        ECGLive = getECG(valList[0],1024,valList[2]);
       }
       else if(valList[1] === 2){
        let temp = prepareSinValues(sinOriginal,valList[2]);
        var arr16 = new Uint16Array(temp);
        var buffer = new Buffer.from(arr16.buffer)
        connection.sendBytes(buffer);
       }
       else if(valList[1] === 3){
        let temp = prepareSinValues(sinData,valList[2]);
        var arr16 = new Uint16Array(temp);
        var buffer = new Buffer.from(arr16.buffer)
        connection.sendBytes(buffer);
        sinData = nextSinData(sinData);
       }
       

       

    });
    connection.on('close', function(reasonCode, description) {
        console.log('Client has disconnected.');
    });
});