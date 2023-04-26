
# HELMLobject

This is an object implementation of the HELML decoder that differs from the classic implementation.

The classic implementation is a function that takes HELML as input and returns a structured object with values.

The object implementation creates a HELML object that allows you to not only decode, but also do a few "tricks".

The main difference with the object implementation is that loading of HELML data and decoding can be done separately.

You can decode already loaded data in different ways (for example, request a selection of different layers).

You can add new HELML data to those already loaded.

You can get values from the specified path.

## Examples:

### Object initialization with initial HELML set

```JavaScript

const hObj = new HELMLobject(`
A:  123
B:  345
C: test
`);

let results = hObj.decode();

console.log(results);
```
results: {A: 123, B: 345, C: 'test'}

### Separately creating a HELML object and adding the original HELML when decoding
```JavaScript

const hObj = new HELMLobject();

let results = hObj.decode(`
A:  123
B:  345
C: test
`);

console.log(results);
```

The result will be exactly the same as in the previous example.

### Adding source lines separately
```JavaScript

const hObj = new HELMLobject();

hObj.addSource(`
A:  123
B:  345
`);

hObj.addSource("C: test");

let results = hObj.decode();

console.log(results);
```
The result will be the same as in the previous examples.