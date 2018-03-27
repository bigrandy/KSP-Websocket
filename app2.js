const util = require('util');
const WebSocket = require('ws');
const { spawn } = require('child_process');
var Parser = require('binary-parser').Parser;
const wss = new WebSocket.Server({port:5000});
var pngtolcd = require('png-to-lcd');
var i2c = require('i2c-bus');
var i2cBus = i2c.openSync(1);
var oled = require('oled-i2c-bus');
var font = require('oled-font-5x7');
var opts = {
    width:128,
    height:64,
    address:0x3C,
    device:'/dev/i2c-1'
};

var backgroundBuff;
var oled = new oled(i2cBus, opts);
oled.fillRect(1,1,128,64,0);
oled.drawLine(1,1,128,1,1);
oled.drawLine(1,16,128,16,1);

var inputPacket = new Parser()
    .endianess('little')
    .string('header',{encoding:'hex',length:2})
    .uint8('size')
    .uint8('id') 
    .float('ap')
    .float('pe')
    .float('sma')
    .float('smia')
    .float('vvi')
    .float('e')
    .float('inc')
    .float('G')
    .int32('TAp')
    .int32('TPe')
    .float('TrueAnomaly')
    .float('Density')
    .int32('period')
    .float('RadarAltitude')
    .float('Altitude')
    .float('Vsurf')
    .float('lat')
    .float('long')
    .float('LqdFuelTot')
    .float('LqdFuel')
    .float('OxidizerTot')
    .float('Oxidizer')
    .float('eChargeTot')
    .float('eCharge')
    .float('monoPropTot')
    .float('monoProp')
    .float('intakeAirTot')
    .float('intakeAir')
    .float('solidFuelTot')
    .float('solidFuel')
    .float('xenonGasTot')
    .float('xenonGas')
    .float('lqdFuelTotS')
    .float('lqdFuelS')
    .float('oxidizerTotS')
    .float('oxidizerS')
    .uint32('missionTime')
    .float('deltaTime')
    .float('VOrbit')
    .uint32('mnTime')
    .float('MNDeltaV')
    .float('Pitch')
    .float('Roll')
    .float('Heading')
    .uint16('actionGroups')
    .uint8('soiNumber')
    .uint8('maxOverHeatPercent')
    .float('machNumber')
    .float('IAS')
    .uint8('CurrentStage')
    .uint8('totalStages')
    .float('TargetDist')
    .float('TargetV')
    .uint8('navballSASMode')
    .uint8('checksum')
;

//var testBuff = new Buffer('beefc801d8579842351a12c98de292486e63ef462b8a173b21ab7e3ff01cc73d80b67e3f0000000014010000da0f4940efc18e3f28020000f7736d40d85798427d96ef3bea14c7bd881d95c2000034440000344400005c4400005c44e17a484200004842000020410000000000000000000000000080bb440080bb4400000000000000000000000000000000000000000000000002000000cdcc4c3ec3f52e4300000000000000000000b44200000000636ad83e0000821a88f2d8379e93143c070700000000000000002066','hex');
//console.log(inputPacket.parse(testBuff));

var updateCounter = 0;

wss.on('connection', function connection(ws) {
    console.log('new connection established from client...');

    ws.on('message', function incoming(data) {
	updateCounter++;
	if (updateCounter % 4 == 0){
	    return;
	}
	var buff = new Buffer(data);
	var vesselState = inputPacket.parse(buff);
	oled.fillRect(4,4,128,6,0);
	var lqdFuelPercentS = ((vesselState.LqdFuelS / vesselState.LqdFuelTotS) * 100).toFixed(1);
	var oxidizerPercentS = ((vesselState.oxidizerS / vesselState.oxidizerTotS) * 100).toFixed(1);
	var eChargePercent = ((vesselState.eCharge  / vesselState.eChargeTot) * 100).toFixed(1);
	var monoPropPercent = ((vesselState.monoProp / vesselState.monoPropTot) * 100).toFixed(1);
//	console.log(lqdFuelPercent);
	oled.fillRect(4,4,( lqdFuelPercentS / 100 * 120).toFixed(0) ,6,0);
	oled.fillRect(4,6,( oxidizerPercentS /100 * 120).toFixed(0) ,8,0);
	oled.fillRect(4,8,( eChargePercent / 100 * 120).toFixed(0), 10,0);
	oled.fillRect(4,10,(monoPropPercent/ 100 * 120).toFixed(0), 12,0);
	oled.setCursor(4, 18);
	oled.fillRect(4, 18, 128, 64, 0);
	oled.writeString(font,1,'RALT:' + vesselState.RadarAltitude.toFixed(1), 1);
	oled.setCursor(4, 26);
	oled.writeString(font,1,'TAp:' + vesselState.TAp, 1);
	oled.setCursor(4, 34);
	oled.writeString(font,1,'TPe:' + vesselState.TPe, 1);
	oled.setCursor(4, 42);
	oled.writeString(font,1,'Ap:' + vesselState.ap.toFixed(1),1);
	oled.setCursor(4, 50);
	oled.writeString(font, 1, 'Pe:' + vesselState.pe.toFixed(1),1);
    });
});