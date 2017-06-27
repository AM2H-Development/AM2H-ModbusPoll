/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const _m = new Map();

class modbusContainer{
    constructor(address,topic){
        this.modbusAddress=address;
        this.topic=topic;
    }
}

function addModbusContainer(address,topic){
    _m.set(address,new modbusContainer(address,topic));
}

addModbusContainer(30051,'akm/inverter/state/mode');
addModbusContainer(30533,'akm/inverter/state/daypower');


var cfg = require('./cfg/config');


// MQTT Client
const mqtt = require('mqtt');
const mqttClient  = mqtt.connect('mqtt://' + cfg.mqttServer);

var net = require('net');
var client = new net.Socket();

client.connect(cfg.modbusPort, cfg.modbusSlave, function() {
	console.log('Connected');
        });
        
setInterval(()=>{
    var interval=0;
    for (var item of _m){
        var command = item[1].modbusAddress;
        var hb = command>>8;
        var lb = command & 0x00FF;
        console.log('String: ' + hb + " " + lb);
        const buf4 = Buffer.from([0,0,0,0,0,6,3,3,hb,lb,0,4]);
        console.log(buf4);
        // client.write(buf4,'binary');
        setTimeout(()=>{client.write(buf4,'binary');},interval);
        interval+=100;
    }
},5000);

client.on('data', function(data) {
        console.log(data.length);
        if (data.length < 16) return;
        var res = (data[9]<<24) + (data[10]<<16) + (data[11]<<8) + data[12];
	console.log('Received: '+data.toString('hex')+ " " + res);
        mqttClient.publish('akm/inverter/state/mode',res.toString());
});