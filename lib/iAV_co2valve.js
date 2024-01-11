"use strict";



class IAV_CO2Valve{
    static name = "iAV CO2 valve";
	static icon= "/icon.svg"; 		// relative to: /drivers/<driver_id>/assets/
	static capabilities = ["measure_temperature", "measure_flow", "target_flow", "limit_flow_high", "limit_flow_low", "operational_status", "operational_status.type", "measure_co2", "target_co2"];
	static capabilitiesOptions= { };
	


	static lib_url = "../../lib/iAV_co2valve.js";
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
		this.node_type 	= 0;	//#00
		this.node_status= 0;	//#01
		this.flow_level = 0;	//#02
		
		this.temperature = 0;	//#03
		this.co2level	= 0;	//#04
		
/*		this.power_avg 	= 0;
		this.power_max 	= 0;
*/
		this.auto_min 	= 0;
		this.auto_max 	= 0;	
		
		this.node_group		= 0;	//#09
		
		this.node_action = 0;		
		this.flow_zone = 0;		
		
		this.flow_setp = 0;
		this.co2_setp = 0;
		
		/*Private connection related info*/
		this.duco_node 		= self.getStoreValue("duco_node");
		this.duco_IPaddress = self.getSetting('address');
		this.duco_IPport	= self.getSetting('port');
		this.duco_modbusID	= self.getSetting('modbus_id');		
		
		/*Create private instance of client ONCE at init*/
		this.client 	= new IAV_CO2Valve.ModbusRTU();	
		console.log("initiated duco device: " + IAV_CO2Valve.name + "@" +this.duco_IPaddress+":"+this.duco_IPport+"->"+this.duco_modbusID+"["+this.duco_node +"]");
		
		
		self.registerCapabilityListener("target_flow", async (value) => {
			//await DeviceApi.setMyDeviceState({ on: value });	//write back
			//this.client.writeHoldingRegisters(10 * this.duco_node, 2);
			return;
		});
    }


    handler(self){  self.log("####### DEVICE_LIB CODE ######");					
					
					
						this.client.setTimeout( 10000 );	//connection timeout
						
						this.client.connectTCP(this.duco_IPaddress, { port: this.duco_IPport }).then(() =>{					
							this.client.setTimeout( 5000 );			//read timeout
							this.client.setID(this.duco_modbusID);				
							
							Promise.all([
								this.client.readInputRegisters(10 * this.duco_node, 3),		//#0, #1, #2
								this.client.readInputRegisters(10 * this.duco_node + 3, 2), //#3, #4
								this.client.readInputRegisters(10 * this.duco_node + 9, 1), //#9
								
								this.client.readHoldingRegisters(10 * this.duco_node, 2),	//No value, depends on sub-zones							
								this.client.readHoldingRegisters(10 * this.duco_node + 4, 3),		//
								this.client.readHoldingRegisters(10 * this.duco_node + 9, 1)
								
							]).then((data) => {									
									this.client.close();
									self.log(data[0].data[2]);
									
									this.node_type	= data[0].data[0];	//input 10									
									this.node_status	= data[0].data[1];	//input 11
									this.flow_level 	= data[0].data[2];	//input 12
									//self.log("box_type: "+this.node_type + ", box_status: "+this.node_status+ ", flow_level: "+this.flow_level); 
									
									this.temperature	= data[1].data[0] *0.1;	
									this.co2level		= data[1].data[1];	
									
									this.node_group			= data[2].data[0];
									
									this.flow_setp		= data[3].data[0];
									this.co2_setp 		= data[3].data[1];	//input 15
									
									//self.log("temperature: "+this.temperature + ", co2level: "+this.co2level); 
									this.flow_zone	= data[4].data[0];	//input 13									
									this.auto_min	= data[4].data[1];	//input 13									
									this.auto_max	= data[4].data[2];	//input 14
									
									this.node_action	= data[5].data[0];	//input 19
									//self.log("auto_min: "+this.auto_min + ", auto_max: "+this.auto_max + ", box_action: "+this.node_action); 

							}).catch((err) => {
									this.client.close();
								self.log(err);
							})							
							
						})	
						.catch(function(e){		self.log(e);
						});	
						
						
						
						// MEASURE_POWER: MOMENTAL (total) CHARGING POWER
						if (self.getCapabilityValue('measure_flow') != this.flow_level) {
							self.setCapabilityValue('measure_flow', this.flow_level)
								.then(()=> {

									let tokens = {
										measure_flow: this.flow_level
									}
								//	self._changedMeasureFlow.trigger(self, tokens, {}).catch(error => { self.error(error) });

								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// co2level
						if (self.getCapabilityValue('measure_co2') != this.co2level) {
							self.setCapabilityValue('measure_co2', this.co2level)
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
						
						// co2level
						if (self.getCapabilityValue('target_co2') != this.co2_setp) {
							self.setCapabilityValue('target_co2', this.co2_setp)
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
						
						// co2level
						if (self.getCapabilityValue('target_flow') != this.flow_setp) {
							self.setCapabilityValue('target_flow', this.flow_setp)
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
						
						// co2level
						if (self.getCapabilityValue('measure_temperature') != this.temperature) {
							self.setCapabilityValue('measure_temperature', this.temperature)
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
						
						// MEASURE_POWER: MOMENTAL (total) CHARGING POWER
						if (self.getCapabilityValue('limit_flow_low') != this.auto_min) {
							self.setCapabilityValue('limit_flow_low', this.auto_min)
								.then(function () {

								/*	let tokens = {
										target_flow.high: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
*/
								}).catch(reason => {
									self.error(reason);
								});
						}
						
						// MEASURE_POWER: MOMENTAL (total) CHARGING POWER
						if (self.getCapabilityValue('limit_flow_high') != this.auto_max) {
							self.setCapabilityValue('limit_flow_high', this.auto_max)
								.then(function () {

								/*	let tokens = {
										target_flow.low: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
*/
								}).catch(reason => {
									self.error(reason);
								});
						}
						
					// OPERATIONAL STATUS
					let state = this.operational_string(this.node_status);				
                    if (self.getCapabilityValue('operational_status') != state ) {				
                        self.setCapabilityValue('operational_status', state )
                            .then(function () {

                                let tokens = {
                                    status: self.homey.__(state)
                                }
                                this._changedOperationalStatus.trigger(self, tokens, {}).catch(error => { self.error(error) });	//Tokens are made availbe in Flows as 'global sources'. For tokens see driver.flow.compose.json
							
                            }).catch(reason => {
                                self.error(reason);
                            });

                    }
					
					// OPERATIONAL STATUS		
					
					let type = IAV_CO2Valve.name;				
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
	
	
	
	getHello(){
		return "hello";
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


    get(key) {
        return this.map.get(key);
    }

    length() {
        return this.map.size;
    }    

}
exports = module.exports = IAV_CO2Valve;