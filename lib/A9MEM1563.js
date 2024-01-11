"use strict";



class A9MEM1563{
    static name = "1P+N (A9MEM1563)";
	static icon= "/icon.svg"; 		// relative to: /drivers/<driver_id>/assets/
	static capabilities = ["measure_voltage.L1", "measure_current.L1", "measure_power.L1", "measure_pf", "operational_status.type"];
	static capabilitiesOptions= { };
	


	static lib_url = "../../lib/A9MEM1563.js";
	static ModbusRTU = require("modbus-serial");	//import globally
		
    constructor(self) {
		
       // Register device triggers, as defined in ./driver.flow.compose.json
  //     this._changedMeasureFlow = self.homey.flow.getDeviceTriggerCard('measure_flow_changed');		
//        this._changedSessionYield = self.homey.flow.getDeviceTriggerCard('changedSessionYield');
        //this._changedChargePower = self.homey.flow.getDeviceTriggerCard('changedChargePower');
//        this._changedCurrent_L1 = self.homey.flow.getDeviceTriggerCard('changedCurrentL1');
		//this._changedPower_L1 = self.homey.flow.getDeviceTriggerCard('changedPowerL1');
		//this._changedVoltage_L1 = self.homey.flow.getDeviceTriggerCard('changedVoltageL1');
		//this._changedChargerLimit = self.homey.flow.getDeviceTriggerCard('changedChargerLimit');
		//this._changedEV_capability = self.homey.flow.getDeviceTriggerCard('changedEV_capability');
		//this._changedYield = self.homey.flow.getDeviceTriggerCard('changedYield');
        //this._changedRequiredEnergy = self.homey.flow.getDeviceTriggerCard('changedRequiredEnergy');
		
		/*Create private variables*/
		
		this.L1_volt 	= 0;
		this.L2_volt 	= 0;	
		this.L3_volt 	= 0;
		this.L1_curr 	= 0;
		this.L2_curr 	= 0;
		this.L3_curr 	= 0;
		this.L1_pwr 	= 0;
		this.L2_pwr 	= 0;
		this.L3_pwr 	= 0;
		this.avg_pf 	= 0;
		
		/*Private connection related info*/
		//this.duco_node 		= self.getStoreValue("duco_node");
		this.duco_IPaddress = self.getSetting('address');
		this.duco_IPport	= self.getSetting('port');
		this.duco_modbusID	= self.getStoreValue('Powertag_node');		
		
		/*Create private instance of client ONCE at init*/
		this.client 	= new A9MEM1563.ModbusRTU();	
		console.log("initiated duco device: " + A9MEM1563.name + "@" +this.duco_IPaddress+":"+this.duco_IPport+"->"+this.duco_modbusID);
		
		
		self.registerCapabilityListener("target_flow", async (value) => {
			//await DeviceApi.setMyDeviceState({ on: value });	//write back
			//this.client.writeHoldingRegisters(10 * this.duco_node, 2);
			return;
		});
    }


    handler(self){  //self.log("####### DEVICE_LIB CODE ######");					
					
					
						this.client.setTimeout( 10000 );	//connection timeout
						
						this.client.connectTCP(this.duco_IPaddress, { port: this.duco_IPport }).then(() =>{					
							this.client.setTimeout( 10000 );			//read timeout
							this.client.setID(this.duco_modbusID);				
							
							Promise.allSettled([
								//this.client.readHoldingRegisters(1000,  10),// 						
								//this.client.readHoldingRegisters(31010, 3),	//
								//this.client.readHoldingRegisters(31024, 1),	//		
														
								this.client.readHoldingRegisters(3027, 6),			//Volt	
								this.client.readHoldingRegisters(2999, 6),			//Current
								
								this.client.readHoldingRegisters(3053, 6),			//Power
								this.client.readHoldingRegisters(3083, 2),			//pf
								this.client.readHoldingRegisters(3259, 2)			//(re)settable energy counter (RW)
							
							
							]).then((data) => {									
									this.client.close();
								
									
									self.log(data[0].status);
									self.log(data[1].status);
									self.log(data[2].status);
									self.log(data[3].status);
									
									if(data[0].status == 'fulfilled')
									{	var buf = new Uint8Array(data[0].value.buffer).buffer;	//create byte array of Uint8
										var view = new DataView(buf);						//Create a data view of it									
										this.L1_volt = view.getFloat32(0);
										this.L2_volt = view.getFloat32(4);
										this.L3_volt = view.getFloat32(8);
										
									} 
									
									if(data[1].status == 'fulfilled')
									{	self.log(data[1].value.buffer);
										var buf = new Uint8Array(data[1].value.buffer).buffer;	//create byte array of Uint8
										var view = new DataView(buf);						//Create a data view of it									
										this.L1_curr = view.getFloat32(0); 						//convert 1st 4 bytes to float32
										this.L2_curr = view.getFloat32(4);
										this.L3_curr = view.getFloat32(8);
									}
									
									if(data[2].status == 'fulfilled')
									{
										var buf = new Uint8Array(data[2].value.buffer).buffer;	//create byte array of Uint8
										var view = new DataView(buf);						//Create a data view of it									
										this.L1_pwr 	= view.getFloat32(0); 						//convert 1st 4 bytes to float32
										this.L2_pwr	= view.getFloat32(4);
										this.L3_pwr = view.getFloat32(8);
									}
									
									if(data[3].status == 'fulfilled')
									{
										var buf = new Uint8Array(data[3].value.buffer).buffer;	//create byte array of Uint8
										var view = new DataView(buf);						//Create a data view of it									
										this.avg_pf	= view.getFloat32(0) * 100; 						//convert 1st 4 bytes to flo
									}

							}).catch((err) => {
									this.client.close();
								self.log(err);
							})							
							
						})	
						.catch(function(e){		self.log(e);
						});	
						
						
					/*L1*/	
						//Voltage
						if (self.getCapabilityValue('measure_voltage.L1') != this.L1_volt) {
							self.setCapabilityValue('measure_voltage.L1', this.L1_volt)
								.then(()=> {

									let tokens = {
										measure_volt: this.L1_volt
									}
								//	self._changedMeasureFlow.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// current
						if (self.getCapabilityValue('measure_current.L1') != this.L1_curr) {
							self.setCapabilityValue('measure_current.L1', this.L1_curr)
								.then(function () {

								/*	let tokens = {
										charging: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
*/
								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// power
						if (self.getCapabilityValue('measure_power.L1') != this.L1_pwr) {
							self.setCapabilityValue('measure_power.L1', 	this.L1_pwr)
								.then(function () {

								/*	let tokens = {
										charging: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
*/
								}).catch(reason => {
									self.error(reason);
								});
						}
						
					/*L2	
						//Voltage
						if (self.getCapabilityValue('measure_voltage.L2') != this.L2_volt) {
							self.setCapabilityValue('measure_voltage.L2', this.L2_volt)
								.then(()=> {

									let tokens = {
										measure_volt: this.L2_volt
									}
								//	self._changedMeasureFlow.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// current
						if (self.getCapabilityValue('measure_current.L2') != this.L2_curr) {
							self.setCapabilityValue('measure_current.L2', this.L2_curr)
								.then(function () {

								//	let tokens = {
								//		charging: tot_power
								//	}
								//	self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// power
						if (self.getCapabilityValue('measure_power.L2') != this.L2_pwr) {
							self.setCapabilityValue('measure_power.L2', 	this.L2_pwr)
								.then(function () {

									let tokens = {
										charging: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}*/
						
					/*L3	
						//Voltage
						if (self.getCapabilityValue('measure_voltage.L3') != this.L3_volt) {
							self.setCapabilityValue('measure_voltage.L3', this.L3_volt)
								.then(()=> {

									let tokens = {
										measure_volt: this.L3_volt
									}
								//	self._changedMeasureFlow.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// current
						if (self.getCapabilityValue('measure_current.L3') != this.L3_curr) {
							self.setCapabilityValue('measure_current.L3', this.L3_curr)
								.then(function () {

									let tokens = {
										charging: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// power
						if (self.getCapabilityValue('measure_power.L3') != this.L3_pwr) {
							self.setCapabilityValue('measure_power.L3', 	this.L3_pwr)
								.then(function () {

									let tokens = {
										charging: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
								}).catch(reason => {
									self.error(reason);
								});
						}	
						*/
						
					// power
						if (self.getCapabilityValue('measure_pf') != this.avg_pf) {
							self.setCapabilityValue('measure_pf', 	this.avg_pf)
								.then(function () {

								/*	let tokens = {
										measure_pf: avg_pf
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
*/
								}).catch(reason => {
									self.error(reason);
								});
						}	
					// OPERATIONAL STATUS		
					
					let type = A9MEM1563.name;				
                    if (self.getCapabilityValue('operational_status.type') != type ) {				
                        self.setCapabilityValue('operational_status.type', type )
                            .then(function () {

                             //   let tokens = {
                             //       status: self.homey.__(type)
                             //   }
                             //   self._changedOperationalStatus.trigger(self, tokens, {}).catch(error => { self.error(error) });	//Tokens are made availbe in Flows as 'global sources'. For tokens see driver.flow.compose.json
							
                            }).catch(reason => {
                                self.error(reason);
                            });

                    }

					
            }
	
	
	operational_string(operational_code){
		
		switch(operational_code){						
				case 0: return "auto";
				case 1: return "10 min high";
				case 2: return "20 min high";
				case 3: return "30 min high";
				case 4: return "Manuel laagstand";
				case 5: return "Manuel middenstand";
				case 6: return "Manuel hoogstand";
				case 7: return "Away mode";
				case 8: return "Permanent low";
				case 9: return "Permanent mid";
				case 10: return "Permanente high";
				case 99: return "Error";
				default: return "Unknown";
			}
		
	}	


}
exports = module.exports = A9MEM1563;