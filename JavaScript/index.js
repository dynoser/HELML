'use strict';

//  npm install helml

import HELML from "./helml/HELML";

let enc = `
--
 :--: X
 :--: Y
--
 :A:
  ::--:  1
  ::--:  2
`;
let dec = HELML.decode(enc);
console.log(dec);

let arr = {
	"A": [1,2,3],
	"B": "This is B-key",
	"C": null,
	"D": {
		"E": "Sub",
		"F": "Sub2"
	}
};

enc = HELML.encode(arr);

console.log(enc);

dec = HELML.decode(enc);

console.log(dec);
