'use strict';

const { Device } = require('homey');
const net = require('net');
//const decodeData = require('../../lib/decodeData.js');

class PowertagModbusDevice extends Device {

    async onInit() {
        let self = this;

		/*Identify device and required device library*/
		let Powertag_node = self.getStoreValue("Powertag_node");
		let node_type  = self.getStoreValue("Powertag_type");
		
		let lib_url = self.getStoreValue("Powertag_lib");
		const Powertag_functions = require(lib_url);
		let Powertag_device = new Powertag_functions(self);
		
		self.log("type: " + node_type +", node: ", Powertag_node + ",using lib: " + lib_url);
		
		//const  ModbusRTU = require("modbus-serial");
	
		Powertag_device.handler(self);
	
		self.pollingInterval = self.homey.setInterval(() =>{		/*call with inherting device environment*/
			self.log("Calling functions from lib: " + lib_url);
			Powertag_device.handler(self);
		}, (self.getSetting("polling")*1000) + (Math.random()*2000) );	//spread load more 
		


		
		
		//this.setupCapabilityListeners();
		//this._registerFlows(self, client);	//was disabled
		
     }
	
	async setupCapabilityListeners() {
		

    }
	
	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	
}

module.exports = PowertagModbusDevice;
