"use strict";


class DucoMaster{
	/*Global shared static library info for Master*/
    static name = "Duco master";
	static icon= "/icon.svg"; 		// relative to: /drivers/<driver_id>/assets/
	static capabilities = ["flow_level", "measure_power.actual", "measure_power.avg", "measure_power.max", "limit_flow_low", "limit_flow_high", "operational_status", "operational_status.type"];
	static capabilitiesOptions= { };
	static lib_url = "../../lib/master.js";
	static ModbusRTU = require("modbus-serial");	//import globally
		
    constructor(self) {
		
       // Register device triggers, as defined in ./driver.flow.compose.json
 //      this._changedOperationalStatus = self.homey.flow.getDeviceTriggerCard('changedOperationalStatus');		
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
		this.box_type 	= 0;
		this.box_status = 0;
		this.flow_level = 0;
		
		this.power 		= 0;
		this.power_avg 	= 0;
		this.power_max 	= 0;

		this.auto_min 	= 0;
		this.auto_max 	= 0;
		this.box_action = 0;		
		
		/*Private connection related info*/
		this.duco_node 		= self.getStoreValue("duco_node");
		this.duco_IPaddress = self.getSetting('address');
		this.duco_IPport	= self.getSetting('port');
		this.duco_modbusID	= self.getSetting('modbus_id');		
		
		/*Create private instance of client ONCE at init*/
		this.client 	= new DucoMaster.ModbusRTU();	
		console.log("initiated duco device: " + DucoMaster.name + "@" +this.duco_IPaddress+":"+this.duco_IPport+"->"+this.duco_modbusID+"["+this.duco_node +"]");
    }


    handler(self){  //self.log("####### DEVICE_LIB CODE ######");					
					
					
						this.client.setTimeout( 10000 );	//connection timeout
						
						this.client.connectTCP(this.duco_IPaddress, { port: this.duco_IPport }).then(() =>{					
							this.client.setTimeout( 5000 );			//read timeout
							this.client.setID(this.duco_modbusID);				
							
							Promise.all([
								this.client.readInputRegisters(10 * this.duco_node, 3),
								this.client.readInputRegisters(13 * this.duco_node, 3),
								
								this.client.readHoldingRegisters(15 * this.duco_node, 2),		//
								this.client.readHoldingRegisters(19 * this.duco_node, 1),		//		
								this.client.writeRegisters((10 * this.duco_node) + 5, [10])	//minimal value
								
							]).then((data) => {									
									this.client.close();
									//self.log(data[0].data[2]);
									
									this.box_type	= data[0].data[0];	//input 10									
									this.box_status	= data[0].data[1];	//input 11
									this.flow_level 	= data[0].data[2];	//input 12
									//self.log("box_type: "+this.box_type + ", box_status: "+this.box_status + ", flow_level: "+this.flow_level); 
									
									this.power		= data[1].data[0];	//input 13									
									this.power_avg	= data[1].data[1];	//input 14
									this.power_max 	= data[1].data[2];	//input 15
									//self.log("power: "+this.power + ", power_avg: "+this.power_avg + ", power_max: "+this.power_max); 
									
									this.auto_min	= data[2].data[0];	//input 13									
									this.auto_max	= data[2].data[1];	//input 14
									
									this.box_action	= data[3].data[0];	//input 19
									//self.log("auto_min: "+this.auto_min + ", auto_max: "+this.auto_max + ", box_action: "+this.box_action); 

							}).catch((err) => {
									this.client.close();
								self.log(err);
							})							
							
						})	
						.catch(function(e){		self.log(e);
						});	
						
						
						
						// MEASURE_POWER: MOMENTAL (total) CHARGING POWER
						if (self.getCapabilityValue('flow_level') != this.flow_level) {
							self.setCapabilityValue('flow_level', this.flow_level)
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
						
						// MEASURE_POWER: MOMENTAL (total) CHARGING power
						if (self.getCapabilityValue('measure_power.actual') != this.power) {
							self.setCapabilityValue('measure_power.actual', this.power)
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
						if (self.getCapabilityValue('measure_power.avg') != this.power_avg) {
							self.setCapabilityValue('measure_power.avg', this.power_avg)
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
						if (self.getCapabilityValue('measure_power.max') != this.power_max) {
							self.setCapabilityValue('measure_power.max', this.power_max)
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
										charging: tot_power
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
										charging: tot_power
									}
									self._changedChargePower.trigger(self, tokens, {}).catch(error => { self.error(error) });
*/
								}).catch(reason => {
									self.error(reason);
								});
						}
						
					// OPERATIONAL STATUS
					let state = this.operational_string(this.box_status);				
                    if (self.getCapabilityValue('operational_status') != state ) {				
                        self.setCapabilityValue('operational_status', state )
                            .then(function () {

                                let tokens = {
                                    status: self.homey.__(state)
                                }
                               // this._changedOperationalStatus.trigger(self, tokens, {}).catch(error => { self.error(error) });	//Tokens are made availbe in Flows as 'global sources'. For tokens see driver.flow.compose.json
							
                            }).catch(reason => {
                                self.error(reason);
                            });

                    }
					
					// OPERATIONAL STATUS		
					
					let type = DucoMaster.name;				
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
}

exports = module.exports = DucoMaster;