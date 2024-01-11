"use strict";

const { Driver } = require('homey');
const net = require('net');



class PowertagModbusDriver extends Driver {

    async onInit() {
        this.log('PowerTag Storage driver has been initialized');
        //this._registerFlows();
    }
/*TODO: operation status needs to match mennekes states*/
    _registerFlows() {
		
  /*      //Conditions
        const isOperationalStatus = this.homey.flow.getConditionCard('isOperationalStatus');
        isOperationalStatus.registerRunListener(async (args, state) => {
            this.log(`[${args.device.getName()}] Condition 'isOperationalStatus' triggered`);

            if (args.device.getCapabilityValue('operational_status') == this.homey.__('Available') && args.status == '0') {
            } else if (args.device.getCapabilityValue('operational_status') == this.homey.__('Occupied') && args.status == '1') {
                return true;
            } else if (args.device.getCapabilityValue('operational_status') == this.homey.__('Reserved') && args.status == '2') {
                return true;
            } else if (args.device.getCapabilityValue('operational_status') == this.homey.__('Unavailable') && args.status == '3') {
                return true;
            } else if (args.device.getCapabilityValue('operational_status') == this.homey.__('Faulted') && args.status == '4') {
                return true;
            } else {
                return false;
            }
        });
	*/
	this.log('...Done');

		
	
    }



//onPairListDevices( data, callback ) {
async onPair(session){
	let self = this;
	let Powertag_settings;
	
	
	
	session.setHandler('settings', async (data) => {
      Powertag_settings = data;
	  self.log(Powertag_settings);
      session.nextView();
    });
	
	session.setHandler('list_devices', async (data) => {

		return   discover(Powertag_settings);
		
	});

	function discover(Powertag_settings)	{	
	
		const  ModbusRTU = require("modbus-serial");
		let client = new ModbusRTU();
	
		self.log(">>Init pairlistdevices");	
		client.setTimeout( 1000 );
		return client.connectTCP(Powertag_settings.address, { port: Powertag_settings.port })
		 .then( async function(data) {	/*Starts in its own environment, we lost local context here*/				
			let node;
			let devices = [];
			
			self.log(">>Connected...");	
			client.setTimeout( 10000 );
				
			let test = [];
			for(node=150;node<170;node++)	//try to read sequential devices
			{	let dev_address = 31024;
			
				client.setTimeout( 10000 );
				client.setID(node);
				await client.readHoldingRegisters (dev_address, 1)	//the system is creating 10 read connections here and fails on the 11th*/
					.then( data =>{
						
							
						
						let device_type = data.data[0];
						let device = require('../../lib/unknown.js');	//default
						self.log("Read:"+node+"= " + device_type);	
						
						switch(device_type){
						case 0		: return ;	//no device
						case 65535	: return;	//no device
						
						case 41: self.log("PowerTag Acti9 M63 1P (A9MEM1520)"); 
								device = require('../../lib/A9MEM1520.js');
								break;						
						case 42: device = require('../../lib/A9MEM1521.js');
								self.log("PowerTag Acti9 M63 1P+N Top (A9MEM1521)"); 
								break;
						case 43: device = require('../../lib/A9MEM1522.js');
								self.log("PowerTag Acti9 M63 1P+N Bottom (A9MEM1522)");  
								break;
						case 44: self.log("PowerTag Acti9 M63 3P (A9MEM1540)");  
								device = require('../../lib/A9MEM1540.js');							
								break;
						case 45: self.log("PowerTag Acti9 M63 3P+N Top (A9MEM1541)");  
								device = require('../../lib/A9MEM1541.js');							
								break;
						case 46: self.log("PowerTag Acti9 M63 3P+N Bottom (A9MEM1542)"); 
								device = require('../../lib/A9MEM1542.js');							
								break;
						case 81: self.log("PowerTag Acti9 F63 1P+N(A9MEM1560)");  
								device = require('../../lib/A9MEM1560.js');	
								break;
						case 82: self.log("PowerTag Acti9 P63 1P+N Top (A9MEM1561)");  
								device = require('../../lib/A9MEM1561.js');	
								break;
						case 83: self.log("PowerTag Acti9 P63 1P+N Bottom (A9MEM1562)");  
								device = require('../../lib/A9MEM1562.js');	
								break;
						case 84: self.log("PowerTag Acti9 P63 1P+N Bottom (A9MEM1563)");  
								device = require('../../lib/A9MEM1563.js');	
								break;
						case 85: self.log("PowerTag Acti9 F63 3P+N (A9MEM1570)");  
								device = require('../../lib/A9MEM1570.js');	
								break;
						case 86: self.log("PowerTag Acti9 P63 3P+N Top (A9MEM1571)");  
								device = require('../../lib/A9MEM1571.js');	
								break;
						case 87: self.log("PowerTag Acti9 P63 3P+N Bottom (A9MEM1572)");  
								device = require('../../lib/A9MEM1572.js');	
								break;
						case 92: self.log("PowerTag NSX 3P-250 A LV434020)");  
								device = require('../../lib/unknown.js');	
								break;
						case 93: self.log("PowerTag NSX 4P-250 A LV434021)");  
								device = require('../../lib/unknown.js');	
								break;
						case 94: self.log("PowerTag NSX 3P-630 A LV434022)");  
								device = require('../../lib/unknown.js');	
								break;
						case 95: self.log("PowerTag NSX 4P-630 A(LV434023)");  
								device = require('../../lib/unknown.js');	
								break;
						//device: self.log("require('../../lib/A9MEM1520.js');	
						default:	//unknown
								//device = require('../../lib/unknown.js');		
						  break;
						}						
					
						
						devices.push({
							name: device.name,
							data: {
								id: Powertag_settings.address +": " + Powertag_settings.port + ":" +node
							},
							settings: Powertag_settings, 	
							store: {	// Optional: The store is dynamic and persistent storage for your device
								Powertag_node: node,
								Powertag_type: device_type,
								Powertag_lib : device.lib_url
							},
							// Optional: These properties overwrite the defaults that you specified in the driver manifest:
							icon: device.icon,	//"/icon.svg", 	// relative to: /drivers/<driver_id>/assets/
							capabilities: device.capabilities, //["flow_level", "measure_power.actual", "measure_power.avg", "measure_power.max", "flow_level.low", "flow_level.high", "operational_status", "operational_status.type"],
							capabilitiesOptions: device.capabilitiesOptions	//{ }									
						});				
						self.log("                 Found device: " + device.name + " @ node: "+node);	
					

					})
					.catch(function(e){			
						self.log("Error on "+node+" discovery cycles:"+ e);					//just log
						//throw new Error("Scan stopped, coud not read all required registers");
					});				
					
					
			}
			self.log("devices found =" + devices);
			return devices;
		})	
		.catch(function(e){		
			
			throw new Error("Could not open device on "+Powertag_settings.address +":"+Powertag_settings.port);
		});
		
		client.close();	
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
	
	self.log("[[[[Returning here]]]");
    //callback( null, devices );

}
 

    #sleep(time) {
        return new Promise((resolve) => this.homey.setTimeout(resolve, time));
    }


}
module.exports = PowertagModbusDriver;
