(()=>{"use strict";var e={650:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0});class n{static encode(e,t=!1){let r=[];e=n.iterablize(e);let o=t?"~":"\n",i=t?".":":",s=t?"_":" ",a=Array.isArray(e);if(!a&&n.ENABLE_BONES){const t=Object.keys(e),n=Array.from({length:t.length},((e,t)=>String(t)));a=t.every(((e,t)=>e===n[t]))}return n._encode(e,r,0,i,s,a),t&&1==r.length&&r.push(""),r.join(o)}static _encode(e,t,r=0,o=":",i=" ",s=!1){const a=null===n.CUSTOM_VALUE_ENCODER?n.valueEncoder:n.CUSTOM_VALUE_ENCODER;for(let l in e){let u=e[l];if(s&&n.ENABLE_BONES)l="--";else if(!s){let e=l.charAt(0),t=l.charAt(l.length-1);-1!==l.indexOf(o)||"#"===e||e===i||" "===e||""===e||t===i||" "===t?e="-":("_"===i?/^[ -}]+$/.test(l):/^[^\x00-\x1F\x7E-\xFF]+$/.test(l))||(e="-"),"-"===e&&(l="-"+n.base64Uencode(l))}let c=o.repeat(r);n.ENABLE_SPC_IDENT&&" "===i&&(c=i.repeat(r)+c);let f=Array.isArray(u);null===u||!f&&"object"!=typeof u?(u=a(u,i),t.push(c+l+o+u)):(n.ENABLE_KEY_UPLINES&&" "===i&&t.push(""),t.push(c+(f?l+o:l)),u=n.iterablize(u),n._encode(u,t,r+1,o,i,f),n.ENABLE_HASHSYMBOLS&&" "===i&&t.push(" ".repeat(r)+"#"))}}static decode(e,t=[0]){const r=null===n.CUSTOM_VALUE_DECODER?n.valueDecoder:n.CUSTOM_VALUE_DECODER;let o="0",i=o,s=new Set(["0"]);"number"!=typeof t&&"string"!=typeof t||(t=[t]);let a=new Set([o]);t.forEach(((e,t)=>{"number"==typeof e&&a.add(e.toString())}));let l=":",u=" ",c="\n";for(c of["\n","~","\r"])if(-1!==e.indexOf(c)){"~"===c&&(l=".",u="_");break}let f=e.split(c),d={},E=[],h=-1;for(let e of f){if(e=e.trim(),!e.length||"#"===e.charAt(0))continue;let t=0;for(;e.charAt(t)===l;)t++;t&&(e=e.substring(t));const c=e.indexOf(l);let f=-1===c?e:e.substring(0,c),p=-1===c?null:e.substring(c+1);(h<0||h>t)&&(h=t);let b=E.length-(t-h);if(b>0){for(;E.length&&b--;)E.pop();i=o}let N=d;for(let e of E)N=N[e];if("-"===f.charAt(0))if("--"===f||"---"===f)f="object"==typeof N?String(Object.keys(N).length):"0";else{if("-+"===f||"-++"===f){null!==p&&(p=p.trim()),"-++"===f?(o=p||"0",i=o):"-+"===f&&(i=null==p?Number.isInteger(parseInt(i))?String(i+1):o:""===p?o:p),s.add(i);continue}{let e=n.base64Udecode(f.substring(1));null!==e&&(f=e)}}null===p||""===p?(N[f]=""===p?[]:{},E.push(f),i=o):a.has(i)&&(N[f]=r(p,u))}return s.size>1&&(d._layers=Array.from(s)),d}static valueEncoder(e,t=" "){if("string"==typeof e){let r;return r="_"===t?/^[ -}]+$/.test(e):/^[^\x00-\x1F\x7E-\xFF]+$/.test(e),r&&e.length?t===e[0]||t===e.slice(-1)||" "===e.slice(-1)?"'"+e+"'":t+e:"-"+n.base64Uencode(e)}{const r=typeof e;switch(r){case"boolean":e=e?"T":"F";break;case"undefined":e="U";break;case"number":if(e===1/0)e="INF";else if(e===-1/0)e="NIF";else if(Number.isNaN(e))e="NAN";else if("_"===t&&!Number.isInteger(e))return"-"+n.base64Uencode(String(e));case"bigint":break;case"object":if(null===e){e="N";break}default:throw new Error(`Cannot encode value of type ${r}`)}}return t+t+e}static valueDecoder(e,t=" "){const r=e.charAt(0);if(t===r){if(e.substring(0,2)!==t+t)return e.slice(1);let r=e.slice(2);return r in n.SPEC_TYPE_VALUES?n.SPEC_TYPE_VALUES[r]:/^-?\d+(.\d+)?$/.test(r)?-1!==r.indexOf(".")?parseFloat(r):parseInt(r,10):"function"==typeof n.CUSTOM_FORMAT_DECODER?n.CUSTOM_FORMAT_DECODER(e,t):r}if('"'===r||"'"===r)return e=e.slice(1,-1),'"'===r?n.stripcslashes(e):e;if("-"===r)e=e.slice(1);else if("function"==typeof n.CUSTOM_FORMAT_DECODER)return n.CUSTOM_FORMAT_DECODER(e,t);return n.base64Udecode(e)}static base64Uencode(e){let t;if("undefined"!=typeof Buffer)t=Buffer.from(e,"binary").toString("base64");else{if("undefined"==typeof window||"function"!=typeof window.btoa)throw new Error("Not found me base64-encoder");t=window.btoa(e)}return t.replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}static base64Udecode(e){for(e=e.replace(/-/g,"+").replace(/_/g,"/");e.length%4;)e+="=";try{let t;if("undefined"!=typeof Buffer)t=Buffer.from(e,"base64").toString("binary");else{if("undefined"==typeof window||"function"!=typeof window.atob)throw new Error("Not found base64-decoder");t=window.atob(e)}return t}catch(e){return null}}static iterablize(e){return"function"!=typeof e[Symbol.iterator]?(e[Symbol.iterator]=function*(){const e=[];for(const t in this)this.hasOwnProperty(t)&&e.push([t,this[t]]);yield*e},e):e instanceof Set||e instanceof Map?Array.from(e.values()):e}static stripcslashes(e){const t={"\\n":"\n","\\t":"\t","\\r":"\r","\\b":"\b","\\f":"\f","\\v":"\v","\\0":"\0","\\\\":"\\"};return e.replace(/\\(n|t|r|b|f|v|0|\\)/g,(e=>t[e]))}}n.ENABLE_BONES=!0,n.ENABLE_SPC_IDENT=!0,n.ENABLE_KEY_UPLINES=!0,n.ENABLE_HASHSYMBOLS=!0,n.CUSTOM_FORMAT_DECODER=null,n.CUSTOM_VALUE_DECODER=null,n.CUSTOM_VALUE_ENCODER=null,n.SPEC_TYPE_VALUES={N:null,U:void 0,T:!0,F:!1,NAN:NaN,INF:1/0,NIF:-1/0},t.default=n},112:function(e,t,n){var r=this&&this.__createBinding||(Object.create?function(e,t,n,r){void 0===r&&(r=n);var o=Object.getOwnPropertyDescriptor(t,n);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,r,o)}:function(e,t,n,r){void 0===r&&(r=n),e[r]=t[n]}),o=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&r(t,e,n);return o(t,e),t},s=this&&this.__awaiter||function(e,t,n,r){return new(n||(n=Promise))((function(o,i){function s(e){try{l(r.next(e))}catch(e){i(e)}}function a(e){try{l(r.throw(e))}catch(e){i(e)}}function l(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,a)}l((r=r.apply(e,t||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.HELMLfromJSON=t.decodeJSONtry=t.removeJSONcomments=t.HELMLtoJSON=t.HELMLtoPHP=t.HELMLtoPython=t.deactivate=t.activate=void 0;const l=i(n(496)),u=a(n(650)),c=a(n(472)),f=a(n(593));let d=["0"];function E(e=null){const t=l.workspace.getConfiguration("helml"),n=t.get("enableident"),r=t.get("enablebones"),o=t.get("enableuplines"),i=t.get("enablehashsym");if(void 0!==n&&n!==u.default.ENABLE_SPC_IDENT&&(t.update("enableident",n,!0),u.default.ENABLE_SPC_IDENT=n),void 0!==r&&r!==u.default.ENABLE_BONES&&(t.update("enablebones",r,!0),u.default.ENABLE_BONES=r),void 0!==o&&o!==u.default.ENABLE_KEY_UPLINES&&(t.update("enableuplines",o,!0),u.default.ENABLE_KEY_UPLINES=o),void 0!==i&&o!==u.default.ENABLE_HASHSYMBOLS&&(t.update("enablehashsym",i,!0),u.default.ENABLE_HASHSYMBOLS=i),null===e||e.affectsConfiguration("helml.getlayers")){const e=t.get("getlayers");e&&(d=[],e.split(",").forEach((e=>d.push(e.trim()))))}}function h(e){return()=>{const t=l.window.activeTextEditor;if(!t)return;const{document:n,selection:r}=t,o=n.getText(r);if(!o)return void l.window.showWarningMessage("No text selected!");const i=e(o);i&&t.edit((e=>{e.replace(r,i)}))}}function p(e){try{const t=u.default.decode(e,d);return f.default.toPythonArr(t,1)}catch(e){return console.error("Error: failed to encode HELML to Python code",e),l.window.showErrorMessage("Failed to encode HELML to Python code"),null}}function b(e){try{const t=u.default.decode(e,d);return c.default.toPHParr(t,1)}catch(e){return console.error("Error: failed to encode HELML to PHP code",e),l.window.showErrorMessage("Failed to encode HELML to PHP code"),null}}function N(e){try{const t=u.default.decode(e,d);return JSON.stringify(t,null,"\t")}catch(e){return console.error("Error: failed to encode HELML to JSON",e),l.window.showErrorMessage("Failed to encode HELML to JSON"),null}}function _(e){return e.replace(/^(\s*)\/\/.*$/gm,"").replace(/\/\*[^*]*\*+([^\/*][^*]*\*+)*\//g,"")}function g(e){try{return JSON.parse(e)}catch(e){return null}}function y(e){try{(e=e.trim()).startsWith('"')&&((e="{"+e).endsWith(",")&&(e=e.slice(0,-1)),e+="}");let t=g(e);return null===t&&(e=_(e),t=JSON.parse(e)),u.default.encode(t)}catch(e){return l.window.showErrorMessage("Failed to decode JSON to HELML!"),null}}E(),l.workspace.onDidChangeConfiguration((e=>{e.affectsConfiguration("helml")&&E(e)})),t.activate=function(e){const t=l.commands.registerCommand("helml.toJSON",h(N)),n=l.commands.registerCommand("helml.fromJSON",h(y)),r=l.commands.registerCommand("helml.toPHP",h(b)),o=l.commands.registerCommand("helml.toPython",h(p)),i=l.commands.registerCommand("helml.fromJSONDoc",(()=>s(this,void 0,void 0,(function*(){const e=l.window.activeTextEditor;if(!e)return;const{document:t,selection:n}=e;let r,o=t.getText(n),i=!o;t.isDirty,o?o===t.getText()&&(i=!0):o=t.getText();const s=y(o);s&&(t.fileName,r=yield l.workspace.openTextDocument({content:s,language:"helml"})),l.window.showTextDocument(r)}))));e.subscriptions.push(t),e.subscriptions.push(i),e.subscriptions.push(n),e.subscriptions.push(r),e.subscriptions.push(o)},t.deactivate=function(){},t.HELMLtoPython=p,t.HELMLtoPHP=b,t.HELMLtoJSON=N,t.removeJSONcomments=_,t.decodeJSONtry=g,t.HELMLfromJSON=y;const m={provideHover(e,t){const n=e.lineAt(t).text,r=e.getWordRangeAtPosition(t),o=(e.getText(r),function(e,t){let n=null,r="key",o=" value";if(!(e=e.trim()).length||"#"===e.charAt(0))return null;let i=0;for(;":"===e.charAt(i);)i++;i&&(e=e.substring(i));const s=e.indexOf(":");let a=-1===s?e:e.substring(0,s),l=-1===s?null:e.substring(s+1);if("-"===a.charAt(0))if("--"===a)r="next",a="[NextNum]";else{if(a.startsWith("-+"))return l?"Layer: "+l:"Layer Next";{r="-b64key";let e=u.default.base64Udecode(a.substring(1));null===e?n="ERROR: encoded KEY contain illegal chars":/^[ -~]+$/.test(e)&&(r=`-b64key(<i>${e}</i>)`)}}if(null===n)if(null===l)n=`Create [${a}] Array`;else if(""===l)n=`Create [${a}] LIST`;else if(l.startsWith(" "))l.startsWith("  ")&&(o=" value <i>(non-string)<i>");else if("-"===l.charAt(0)){o="-b64value";let e=u.default.base64Udecode(l.substring(1));null===e?n="ERROR: encoded VALUE contain illegal chars":o=`-b64=${e}`}else o="UNKNOWN or USER-DEFINED VALUE";return null===n&&(n=r+":"+o),n}(n));return o?new l.Hover(o):null}};l.languages.registerHoverProvider("helml",m)},472:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0});class n{static toPHParr(e,t){"number"==typeof t?(t>10&&(t=10),t=" ".repeat(t)):t=t.slice(0,10);let r=function(e){return t?e.split("\n").map((function(e){return t+e})).join("\n"):e},o=typeof e;switch(!0){case"number"===o:if(Number.isNaN(e))return"NAN";if(e===1/0)return"INF";if(e===-1/0)return"-INF";case"string"===o:case"boolean"===o:case null===e:return JSON.stringify(e);case Array.isArray(e):return(t?"[\n":"[")+e.map((function(e){return n.toPHParr(e,t)})).map(r).join(t?",\n":",")+(t?"\n]":"]");case"object"===o&&!Array.isArray(e):let s=[];for(var i in e)s.push(JSON.stringify(i)+(t?" => ":"=>")+n.toPHParr(e[i],t));return(t?"[\n":"[")+s.map(r).join(t?",\n":",")+(t?"\n]":"]");default:throw new Error("parse error")}}}t.default=n},593:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.default=class{static toPythonArr(e,t=0){const n=" ".repeat(2*t);if(Array.isArray(e)){const r=e.map((e=>n+"  "+this.toPythonArr(e,t+1))).join(",\n");return r?"[\n"+r+"\n"+n+"]":"[]"}if("object"==typeof e&&null!==e){const r=Object.entries(e).map((([e,r])=>`${n}  ${JSON.stringify(e)}: ${this.toPythonArr(r,t+1)}`)).join(",\n");return r?"{\n"+r+"\n"+n+"}":"{}"}return Number.isNaN(e)?'float("nan")':e===1/0?'float("inf")':e===-1/0?'float("-inf")':null===e?"None":!0===e?"True":!1===e?"False":JSON.stringify(e)}}},496:e=>{e.exports=require("vscode")}},t={},n=function n(r){var o=t[r];if(void 0!==o)return o.exports;var i=t[r]={exports:{}};return e[r].call(i.exports,i,i.exports,n),i.exports}(112),r=exports;for(var o in n)r[o]=n[o];n.__esModule&&Object.defineProperty(r,"__esModule",{value:!0})})();
//# sourceMappingURL=extension.js.map