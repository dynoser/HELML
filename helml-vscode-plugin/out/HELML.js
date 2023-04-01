"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HELML {
    static encode(arr, url_mode = false) {
        let results_arr = [];
        // Check arr and convert to iterable (if possible)
        arr = HELML.iterablize(arr);
        let str_imp = url_mode ? "~" : "\n";
        let lvl_ch = url_mode ? '.' : ':';
        let spc_ch = url_mode ? '_' : ' ';
        // is the object a list with sequential keys?
        let is_list = Array.isArray(arr);
        if (!is_list && HELML.ENABLE_BONES) {
            const keys = Object.keys(arr);
            const expectedNumKeys = Array.from({ length: keys.length }, (_, i) => String(i));
            is_list = keys.every((key, index) => key === expectedNumKeys[index]);
        }
        HELML._encode(arr, results_arr, 0, lvl_ch, spc_ch, is_list);
        if (url_mode && results_arr.length == 1) {
            results_arr.push('');
        }
        return results_arr.join(str_imp);
    }
    static _encode(arr, results_arr, level = 0, lvl_ch = ":", spc_ch = " ", is_list = false) {
        // Set value encoder function as default valueEncoder or custom user function
        const valueEncoFun = HELML.CUSTOM_VALUE_ENCODER === null ? HELML.valueEncoder : HELML.CUSTOM_VALUE_ENCODER;
        for (let key in arr) {
            let value = arr[key];
            if (is_list && HELML.ENABLE_BONES) {
                key = '--';
            }
            else {
                // encode key in base64url if it contains unwanted characters
                let fc = key.charAt(0);
                let lc = key.charAt(key.length - 1);
                if (key.indexOf(lvl_ch) !== -1 || key.indexOf('~') !== -1 || fc === '#' || fc === spc_ch || fc === ' ' || fc === '') {
                    fc = "-";
                }
                if (fc === "-" || lc === spc_ch || lc === ' ' || !/^[ -~]+$/.test(key)) {
                    // add "-" to the beginning of the key to indicate it's in base64url
                    key = "-" + HELML.base64Uencode(key);
                }
            }
            // add the appropriate number of colons to the left of the key, based on the current level
            let ident = lvl_ch.repeat(level);
            // add space-ident to the left of the key (if need)
            if (HELML.ENABLE_SPC_IDENT && spc_ch === ' ') {
                ident = spc_ch.repeat(level) + ident;
            }
            let is_arr = Array.isArray(value);
            if (value !== null && (is_arr || typeof value === 'object')) {
                // if the value is an array or iterable, call this function recursively and increase the level
                if (HELML.ENABLE_KEY_UPLINES && spc_ch === ' ') {
                    results_arr.push('');
                }
                results_arr.push(ident + (is_arr ? key + lvl_ch : key));
                value = HELML.iterablize(value);
                HELML._encode(value, results_arr, level + 1, lvl_ch, spc_ch, is_arr);
                if (HELML.ENABLE_KEY_UPLINES && spc_ch === ' ') {
                    results_arr.push(' '.repeat(level) + '#');
                }
            }
            else {
                // if the value is not an array, run it through a value encoding function
                value = valueEncoFun(value, spc_ch);
                // add the key:value pair to the output
                results_arr.push(ident + key + lvl_ch + value);
            }
        }
    }
    static decode(src_rows, layers_list = [0]) {
        // Set value decoder function as default valueDecoder or custom user function
        const valueDecoFun = HELML.CUSTOM_VALUE_DECODER === null ? HELML.valueDecoder : HELML.CUSTOM_VALUE_DECODER;
        // If the input is an array, use it. Otherwise, split the input string into an array.
        let layer_init = '0';
        let layer_curr = layer_init;
        let all_layers = new Set(['0']);
        // convert all elements in layers_list to String type
        layers_list.forEach((item, index) => {
            if (typeof item === "number") {
                layers_list[index] = item.toString();
            }
        });
        let lvl_ch = ':';
        let spc_ch = ' ';
        let exploder_ch = "\n";
        for (exploder_ch of ["\n", "~", "\r"]) {
            if (src_rows.indexOf(exploder_ch) !== -1) {
                if (exploder_ch === "~") {
                    lvl_ch = '.';
                    spc_ch = '_';
                }
                break;
            }
        }
        let str_arr = src_rows.split(exploder_ch);
        // Initialize result array and stack for keeping track of current array nesting
        let result = {};
        let stack = [];
        let min_level = -1;
        // Loop through each line in the input array
        for (let line of str_arr) {
            line = line.trim();
            // Skip empty lines and comment lines starting with '#'
            if (!line.length || line.charAt(0) === '#')
                continue;
            // Calculate the level of nesting for the current line by counting the number of colons at the beginning
            let level = 0;
            while (line.charAt(level) === lvl_ch) {
                level++;
            }
            // If the line has colons at the beginning, remove them from the line
            if (level) {
                line = line.substring(level);
            }
            // Split the line into a key and a value (or null if the line starts a new array)
            const firstDiv = line.indexOf(lvl_ch);
            let key = firstDiv === -1 ? line : line.substring(0, firstDiv);
            let value = firstDiv === -1 ? null : line.substring(firstDiv + 1);
            // check min_level
            if (min_level < 0 || min_level > level) {
                min_level = level;
            }
            // Remove keys from the stack if level decreased
            let extra_keys_cnt = stack.length - (level - min_level);
            if (extra_keys_cnt > 0) {
                // removing extra keys from stack
                while (stack.length && extra_keys_cnt--) {
                    stack.pop();
                }
                layer_curr = layer_init;
            }
            // Find the parent element in the result array for the current key
            let parent = result;
            for (let parentKey of stack) {
                parent = parent[parentKey];
            }
            // Decode the key if it starts with an equals sign
            if (key.charAt(0) === '-') {
                if (key === '--' || key === '---') {
                    // Next number keys
                    key = (typeof parent === 'object') ? String(Object.keys(parent).length) : '0';
                }
                else if (key.startsWith('-+')) {
                    // Layer control keys
                    if (value !== null) {
                        value = value.trim();
                    }
                    if (key === '-++') {
                        layer_init = value ? value : '0';
                        layer_curr = layer_init;
                    }
                    else if (key === '-+') {
                        if (value == null) {
                            layer_curr = Number.isInteger(parseInt(layer_curr)) ? String(layer_curr + 1) : layer_init;
                        }
                        else {
                            layer_curr = (value === '') ? layer_init : value;
                        }
                    }
                    all_layers.add(layer_curr);
                    continue;
                }
                else {
                    let decoded_key = HELML.base64Udecode(key.substring(1));
                    if (decoded_key !== null) {
                        key = decoded_key;
                    }
                }
            }
            // If the value is null, start a new array and add it to the parent array
            if (value === null || value === '') {
                parent[key] = value === '' ? [] : {};
                stack.push(key);
                layer_curr = layer_init;
            }
            else if (layers_list.includes(layer_curr)) {
                // Decode the value by current decoder function and add the key-value pair to the current array
                parent[key] = valueDecoFun(value, spc_ch);
            }
        }
        if (all_layers.size > 1) {
            result['_layers'] = Array.from(all_layers);
        }
        // Return the result array
        return result;
    }
    static valueEncoder(value, spc_ch = ' ') {
        if (typeof value === 'string') {
            let need_encode, reg_str;
            if ('_' === spc_ch) {
                // for url-mode
                need_encode = (value.indexOf('~') !== -1);
                // ASCII visible chars
                reg_str = /^[ -~]+$/;
            }
            else {
                need_encode = false;
                // utf-8 visible chars
                reg_str = /^[\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]+$/;
            }
            if (need_encode || !reg_str.test(value) || ('_' === spc_ch && value.indexOf('~') !== -1)) {
                // if the string contains special characters, encode it in base64
                return "-" + HELML.base64Uencode(value);
            }
            else if (!value.length || spc_ch === value[0] || spc_ch === value.slice(-1) || /\s/.test(value.slice(-1))) {
                // for empty strings or those that have spaces at the beginning or end
                return "'" + value + "'";
            }
            else {
                // if the value is simple, just add one space at the beginning
                return spc_ch + value;
            }
        }
        else {
            const type = typeof value;
            switch (type) {
                case 'boolean':
                    value = (value ? 'T' : 'F');
                    break;
                case 'undefined':
                    value = 'U';
                    break;
                case 'number':
                    if (value === Infinity) {
                        value = "INF";
                    }
                    else if (value === -Infinity) {
                        value = "NIF";
                    }
                    else if (Number.isNaN(value)) {
                        value = "NAN";
                    }
                    else if ('_' === spc_ch && !Number.isInteger(value)) {
                        // for url-mode because dot-inside
                        return "-" + HELML.base64Uencode(String(value));
                    }
                /* falls through */
                case 'bigint':
                    break;
                case 'object':
                    if (value === null) {
                        value = 'N';
                        break;
                    }
                default:
                    throw new Error(`Cannot encode value of type ${type}`);
            }
        }
        return spc_ch + spc_ch + value;
    }
    static valueDecoder(encodedValue, spc_ch = ' ') {
        const fc = encodedValue.charAt(0);
        if (spc_ch === fc) {
            if (encodedValue.substring(0, 2) !== spc_ch + spc_ch) {
                // if the string starts with only one space, return the string after it
                return encodedValue.slice(1);
            }
            // if the string starts with two spaces, then it encodes a non-string value
            let slicedValue = encodedValue.slice(2); // strip left spaces
            if (slicedValue in HELML.SPEC_TYPE_VALUES) {
                return HELML.SPEC_TYPE_VALUES[slicedValue];
            }
            if (/^-?\d+(.\d+)?$/.test(slicedValue)) {
                // it's probably a numeric value
                if (slicedValue.indexOf('.') !== -1) {
                    // if there's a decimal point, it's a floating point number
                    return parseFloat(slicedValue);
                }
                else {
                    // if there's no decimal point, it's an integer
                    return parseInt(slicedValue, 10);
                }
            }
            // custom user-defined function
            if (typeof HELML.CUSTOM_FORMAT_DECODER === 'function') {
                return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
            }
            return slicedValue;
        }
        else if ('"' === fc || "'" === fc) { // it's likely that the string is enclosed in single or double quotes
            encodedValue = encodedValue.slice(1, -1); // trim the presumed quotes at the edges
            return (fc === '"') ? HELML.stripcslashes(encodedValue) : encodedValue;
        }
        else if ("-" === fc) {
            encodedValue = encodedValue.slice(1);
        }
        else if (typeof HELML.CUSTOM_FORMAT_DECODER === 'function') {
            return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
        }
        // if there are no spaces or quotes at the beginning, the value should be in base64
        return HELML.base64Udecode(encodedValue);
    }
    static base64Uencode(str) {
        let base64;
        base64 = Buffer.from(str, 'binary').toString('base64');
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    static base64Udecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        try {
            const buffer = Buffer.from(str, 'base64');
            return buffer.toString('binary');
        }
        catch (e) {
            return null;
        }
    }
    static iterablize(arr) {
        if (typeof arr[Symbol.iterator] !== 'function') {
            arr[Symbol.iterator] = function* () {
                const entries = [];
                for (const key in this) {
                    if (this.hasOwnProperty(key)) {
                        entries.push([key, this[key]]);
                    }
                }
                yield* entries;
            };
            return arr;
        }
        else if (arr instanceof Set || arr instanceof Map) {
            return Array.from(arr.values());
        }
        return arr;
    }
    static stripcslashes(str) {
        const controlCharsMap = {
            '\\n': '\n',
            '\\t': '\t',
            '\\r': '\r',
            '\\b': '\b',
            '\\f': '\f',
            '\\v': '\v',
            '\\0': '\0',
            '\\\\': '\\'
        };
        return str.replace(/\\(n|t|r|b|f|v|0|\\)/g, (match) => controlCharsMap[match]);
    }
}
HELML.ENABLE_BONES = true; // For encode: enable use "next"-keys like :--:
HELML.ENABLE_SPC_IDENT = true; // For encode: add space-indentation at begin of string
HELML.ENABLE_KEY_UPLINES = true; // For encode: add empty string before array-create-keys
HELML.CUSTOM_FORMAT_DECODER = null;
HELML.CUSTOM_VALUE_DECODER = null;
HELML.CUSTOM_VALUE_ENCODER = null;
HELML.SPEC_TYPE_VALUES = {
    'N': null,
    'U': undefined,
    'T': true,
    'F': false,
    'NAN': NaN,
    'INF': Infinity,
    'NIF': -Infinity
};
exports.default = HELML;
