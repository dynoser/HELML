# HELML

![helml-logo](https://github.com/dynoser/HELML/raw/master/logo/icon.png)

* [HELML format definition (en)](https://github.com/dynoser/HELML/blob/master/docs/README-HELML_en.md)
* [Описание формата HELML (ru)](https://github.com/dynoser/HELML/blob/master/docs/README-HELML_ru.md)

## Install

```shell
$ npm install helml
```

## Usage

### As an ES6 Module

```javascript
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
```

Result:
```console
A:
 :--:  1
 :--:  2
 :--:  3
#
B: This is B-key
C:  N

D
 :E: Sub
 :F: Sub2
#
```

See also:
 * plugin "HELML" for Visual Studio Code
 * Try online [HELML plugin](https://marketplace.visualstudio.com/items?itemName=dynoser.helml) in [vscode.dev](https://vscode.dev)

