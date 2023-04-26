// ***** EXAMPLES ****


import HELMLobject from "./HELMLobject";

let hObj = new HELMLobject(`
A:  123
B:  345
C: test
`);

let results = hObj.decode();

console.log(results);


hObj = new HELMLobject(`
A: 1
B:
:X:  777
:Y:  2
C: 3
<<B
:-+:ru
:Z:  555
`);

hObj.selectLayers('ru');

let val = hObj.get('B: Z');
console.log(val);

let result = hObj.decode();

console.log(result);




// for(const keyValue of hObj) {
//     console.log (keyValue);
// }