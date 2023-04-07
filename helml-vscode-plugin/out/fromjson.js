"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeJSONtry2 = exports.decodeJSONtry1 = exports.removeJSONcomments = void 0;
function removeJSONcomments(json_str) {
    //return json_str;
    const re1 = /^(\s*)\/\/.*$/gm; // remove comments from string-begin
    const re2 = /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//g; // remove comments from end
    return json_str
        .replace(re1, '')
        .replace(re2, '');
}
exports.removeJSONcomments = removeJSONcomments;
function decodeJSONtry1(json_str) {
    try {
        return JSON.parse(json_str);
    }
    catch (e) {
        return null;
    }
}
exports.decodeJSONtry1 = decodeJSONtry1;
function decodeJSONtry2(json_str) {
    json_str = json_str.trim();
    // try decode as it
    let objArr = decodeJSONtry1(json_str);
    if (objArr !== null) {
        return objArr;
    }
    // if not starts With "{" then try add
    if (!json_str.startsWith('{')) {
        // add { brefore block
        json_str = '{' + json_str;
        // remove "," from end if have
        if (json_str.endsWith(",")) {
            json_str = json_str.slice(0, -1);
        }
        // add } after block
        json_str += '}';
        // try to decode this version
        objArr = decodeJSONtry1(json_str);
        if (objArr !== null) {
            return objArr;
        }
    }
    // try to remove comments
    json_str = removeJSONcomments(json_str);
    return decodeJSONtry1(json_str);
}
exports.decodeJSONtry2 = decodeJSONtry2;
