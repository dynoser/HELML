'use strict';

//  npm install helml

import HELML from "helml";

let arr = {
	"A": [1,2,3],
	"B": "This is B-key",
	"C": null,
	"D": {
		"E": "Sub",
		"F": "Sub2"
	}
};

let enc = HELML.encode(arr);

console.log(enc);

let dec = HELML.decode(enc);

console.log(dec);
