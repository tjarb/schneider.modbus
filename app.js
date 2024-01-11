"use strict";

const { App } = require('homey');
const { Log } = require('homey-log');

class DucoModbusApp extends App {

  async onInit() {
    this.homeyLog = new Log({ homey: this.homey });
    this.log('Initializing Duco Modbus app ...');
  }
}

module.exports = DucoModbusApp;
