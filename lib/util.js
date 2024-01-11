'use strict';

exports.U16toS16 = function (value) {
		var ref = (value);
		ref = (ref > 32767) ? -((ref & 0x7FFF) ^ 0x7FFF)-1 : ref;
		return ref;
	};

exports.S16toU16 = function (value) {
		var ref = (value);
		ref = (ref < 0) ? ( ((-ref) & 0xFFFF) ^ 0xFFFF)+1 : ref;
		console.log("conversion test: S16 to U16: " + value + " => " + ref);
		return ref;
	};