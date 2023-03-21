const HELML = require('./HELML');
const jsesc = require('./jsesc');
const phparr = require('./phparr');
const pythonarr = require('./pythonarr');

const h_ml = `
name: helmlext
displayName: helmlext
description: Plugin to encode/decode HELML data
version: 0.0.2
publisher: dynoser
license: MIT
repository
:type: git
:url: https://github.com/dynoser/HELML/tree/master/helml-vscode-plugin
engines
:vscode: ^1.65.0
categories:
:0: Other
icon: images/icon.png
activationEvents:
:0: onCommand:helmlext.toJSON
:1: onCommand:helmlext.fromJSON
main: ./out/extension.js
contributes
:commands:
::0
:::command: helml.toJSON
:::title: HELML toJSON
::1
:::command: helml.fromJSON
:::title: HELML fromJSON
::2
:::command: helml.toJavaScript
:::title: HELML toJavaScript
::3
:::command: helml.toPHP
:::title: HELML toPHP
::4
:::command: helml.toPython
:::title: HELML toPython
scripts
:lint: eslint .
:pretest: npm run lint
devDependencies
:@types/vscode: ^1.65.0
:@types/glob: ^7.2.0
:@types/mocha: ^9.1.0
:@types/node: ^14.x
:eslint: ^8.9.0
:glob: ^7.2.0
:mocha: ^9.2.1
:typescript: ^4.5.5
:@vscode/test-electron: ^2.1.2
`;

obj_arr = HELML.decode(h_ml);

code_str = pythonarr(obj_arr);

console.log(code_str);
