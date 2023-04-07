"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoverProvider = exports.exploreLine = void 0;
const vscode = __importStar(require("vscode"));
const HELML_1 = __importDefault(require("./HELML"));
const LineHELML_1 = __importDefault(require("./LineHELML"));
const blocklook = __importStar(require("./blocklook"));
// Hover-controller block
function exploreLine(src_str, word) {
    if (src_str.indexOf('~') != -1) {
        return "Char `~` illegal for HELML, please encode it to base64";
    }
    let line = new LineHELML_1.default(src_str);
    if (line.is_ignore) {
        if (line.key === '#') {
            return "*Comment line*";
        }
        return null;
    }
    let key = line.key;
    let value = line.value;
    let key_str = '`' + key + '`';
    let value_str = value;
    if (line.is_layer) {
        // Make value bold in Markdown
        value_str = '*' + value + '*';
        // layer key -+
        if (key === '-+') {
            if (value) {
                return "Layer temp: " + value_str;
            }
            return "Layer Next";
        }
        // Layer key -++
        if (value) {
            return "Layer init: " + value_str;
        }
        return "Layer init: 0";
    }
    // key analyze
    let keyIsSpec = false;
    let fc = key.charAt(0);
    if (fc === '-') {
        keyIsSpec = true;
        // Next key --
        if (key === '--') {
            key_str = "`NextNum`";
        }
        else {
            // -base64
            if (/^[A-Za-z0-9\-_+\/=]*$/.test(key)) {
                let decoded_key = HELML_1.default.base64Udecode(key.substring(1));
                if (null === decoded_key) {
                    return "ERROR: Can't decode KEY from base64url";
                }
                if (/^[ -~]+$/.test(decoded_key)) {
                    // show decoded key if possible
                    key_str = `(*${decoded_key}*)`;
                }
                else {
                    key_str = `(base64:${key})`;
                }
            }
            else {
                key_str = 'ERROR: KEY must contain chars from base64/base64url encode';
            }
        }
    }
    else if (fc === ' ') {
        return "ERROR: space before key";
    }
    // Creaters
    if (line.is_creat) {
        if (value === null) {
            return `Create Array: ${key_str}`;
        }
        return `Create LIST: ${key_str}`;
    }
    // Now value is not empty string. Key:value variants analyzing
    fc = value.charAt(0);
    const l = value.length;
    const sc = l > 1 ? value.charAt(1) : '';
    if (fc === ' ') {
        if (sc === ' ') {
            let slicedValue = value.slice(2); // strip left spaces
            switch (slicedValue) {
                case 'N':
                    value_str = ' *null*';
                    break;
                case 'U':
                    value_str = ' *undefined*';
                    break;
                case 'T':
                    value_str = ' *true*';
                    break;
                case 'F':
                    value_str = ' *false*';
                    break;
                case 'NAN':
                    value_str = ' *NaN*';
                    break;
                case 'INF':
                    value_str = ' *Infinity*';
                    break;
                case 'NIF':
                    value_str = ' *-Infinity*';
                    break;
                default:
                    if (/^-?\d+(.\d+)?$/.test(slicedValue)) {
                        // it's probably a numeric value
                        if (slicedValue.indexOf('.') !== -1) {
                            // if there's a decimal point, it's a floating point number
                            value_str = " *(float)*" + slicedValue;
                        }
                        else {
                            // if there's no decimal point, it's an integer
                            value_str = " *(int)*" + slicedValue;
                        }
                    }
                    else {
                        value_str = " *(unknown)*" + slicedValue;
                    }
            }
        }
        else if (!keyIsSpec) {
            // Plain key and Plain value
            return `${key_str} = "${value}"`;
        }
    }
    else if (fc === '"' || fc === "'") {
        value_str = `${fc}*quoted value*"${fc}`;
    }
    else if (fc === '-') {
        if (l === 1) {
            value_str = '""';
        }
        else {
            if (/^[A-Za-z0-9\-_+\/=]*$/.test(value)) {
                let decoded_value = HELML_1.default.base64Udecode(value.substring(1));
                if (null === decoded_value) {
                    return "ERROR: Can't decode VALUE from base64url";
                }
                value_str = `(*${decoded_value}*)`;
            }
            else {
                return "ERROR: VALUE must contain chars from base64/base64url encode";
            }
        }
    }
    else {
        value_str = `UNKNOWN or USER-DEFINED VALUE, fc="${fc}"`;
    }
    return key_str + ":" + value_str;
}
exports.exploreLine = exploreLine;
exports.hoverProvider = {
    provideHover(document, position) {
        const line = document.lineAt(position);
        const text = line.text;
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);
        let currBlockObj = blocklook.edit_block_lookup(position.line);
        const parsedText = exploreLine(text, word);
        if (parsedText) {
            return new vscode.Hover(parsedText);
        }
        return null;
    }
};
