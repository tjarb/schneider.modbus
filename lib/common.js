"use strict";




function discover(duco_settings)	{	
	let self = this;
	
	const  ModbusRTU = require("modbus-serial");
	let client = new ModbusRTU();

	let modbus_ID = 1;
	let IP_address = "192.168.2.173";	
	let IP_port = 502;
	console.log(">>Init pairlistdevices");	
	
	client.setTimeout( 1000 );
	return client.connectTCP(duco_settings.address, { port: duco_settings.port })
	 .then( async function(data) {	/*Starts in its own environment, we lost local context here*/				
		let node;
		let devices = [];
		

		
		console.log(">>Connected...");	
		client.setTimeout( 1000 );
		client.setID(1);		
		let test = [];
		for(node=1;node<100;node++)	//try to read sequential devices
		{	let dev_address = node*10;
			await client.readInputRegisters (dev_address, 1)	//the system is creating 10 read connections here and fails on the 11th*/
				.then( data =>{
					let device_type = data.data[0];
					self.log("Read:"+node+"= " + device_type);	
					
					switch(device_type){
					case 0: break;	//no device
					case 10: 	//Masterbox				
								const master = require('master.js');
													
								devices.push({
									name: master.name,
									data: {
										id: duco_settings.address +": " + duco_settings.port + ":" +node
									},
									settings: duco_settings										,										
									store: {	// Optional: The store is dynamic and persistent storage for your device
											duco_node: node
									},
									// Optional: These properties overwrite the defaults that you specified in the driver manifest:
									icon: master.icon,	//"/icon.svg", 	// relative to: /drivers/<driver_id>/assets/
									capabilities: master.capabilities, //["flow_level", "measure_power.actual", "measure_power.avg", "measure_power.max", "flow_level.low", "flow_level.high", "operational_status", "operational_status.type"],
									capabilitiesOptions: master.capabilitiesOptions	//{ }																									
								});				
								self.log("Found master box:" + master.name);										
								break;
								
					case 11: 	//regular valve		
								const regvalve = require('regvalve.js');
						
								devices.push({
									name: regvalve.name,
									data: {
										id: duco_settings.address +": " + duco_settings.port + ":" +node
									},
									settings: duco_settings										,										
									store: {	// Optional: The store is dynamic and persistent storage for your device
											duco_node: node
									},
									// Optional: These properties overwrite the defaults that you specified in the driver manifest:
									icon: regvalve.icon,	//"/icon.svg", 	// relative to: /drivers/<driver_id>/assets/
									capabilities: regvalve.capabilities, //["flow_level", "measure_power.actual", "measure_power.avg", "measure_power.max", "flow_level.low", "flow_level.high", "operational_status", "operational_status.type"],
									capabilitiesOptions: regvalve.capabilitiesOptions	//{ }																									
								});						
								self.log("Found regular valve: " + regvalve.name);	
								break;			
								
					case 12: 	//regular valve	
								const co2valve = require('co2valve.js');
					
								devices.push({
									name: co2valve.name,
									data: {
										id: duco_settings.address +": " + duco_settings.port + ":" +node
									},
									settings: duco_settings										,										
									store: {	// Optional: The store is dynamic and persistent storage for your device
											duco_node: node
									},
									// Optional: These properties overwrite the defaults that you specified in the driver manifest:
									icon: co2valve.icon,	//"/icon.svg", 	// relative to: /drivers/<driver_id>/assets/
									capabilities: co2valve.capabilities, //["flow_level", "measure_power.actual", "measure_power.avg", "measure_power.max", "flow_level.low", "flow_level.high", "operational_status", "operational_status.type"],
									capabilitiesOptions: co2valve.capabilitiesOptions	//{ }																									
								});						
								self.log("Found CO2 valve: "+co2valve.name);	
								break;			
					case 13: 	//regular valve	
								const rh_valve = require('RHvalve.js');
					
								devices.push({
									name: rh_valve.name,
									data: {
										id: duco_settings.address +": " + duco_settings.port + ":" +node
									},
									settings: duco_settings										,										
									store: {	// Optional: The store is dynamic and persistent storage for your device
											duco_node: node
									},
									// Optional: These properties overwrite the defaults that you specified in the driver manifest:
									icon: rh_valve.icon,	//"/icon.svg", 	// relative to: /drivers/<driver_id>/assets/
									capabilities: rh_valve.capabilities, //["flow_level", "measure_power.actual", "measure_power.avg", "measure_power.max", "flow_level.low", "flow_level.high", "operational_status", "operational_status.type"],
									capabilitiesOptions: rh_valve.capabilitiesOptions	//{ }																									
								});						
								
								break;						
					default:	break;
					}						
				

				})
				.catch(function(e){			
					self.log("Error on "+node+" discovery cycles:"+ e);					//just log
					//throw new Error("Scan stopped, coud not read all required registers");
				});				
					
				
		}
		self.log("devices var =" + devices);
		return devices;
	})	
	.catch(function(e){		
		let Ip_Address = "192.168.2.173";
		let port = "502";
		throw new Error("Could not open device on "+duco_settings.address +":"+duco_settings.port);
	});
	
	self.log(devices);
	return devices;
	
	//const devices = await DeviceApi.discoverDevices();	//Implement discovery//
  /*  const devices = [
	  {	//https://apps.developer.homey.app/the-basics/devices/pairing#device-pairing-data//
		// Required properties:
		"data": { "id": "abcd" },

		// Optional properties, these overwrite those specified in app.json:
		// "name": "My Device",
		// "icon": "/my_icon.svg", // relative to: /drivers/<driver_id>/assets/
		// "capabilities": [ "onoff", "dim" ],
		// "capabilitiesOptions: { "onoff": {} },

		// Optional properties, device-specific:
		// "store": { "foo": "bar" },
		// "settings": { "my_setting": "my_value" },

	  }
	  
	  
	 
	]*/
}
	
exports = module.exports = discover;