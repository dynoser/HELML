"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HELML {
    static decode(src_rows, get_layers = [0]) {
        // Set value decoder function as default valueDecoder or custom user function
        const valueDecoFun = HELML.CUSTOM_VALUE_DECODER === null ? HELML.valueDecoder : HELML.CUSTOM_VALUE_DECODER;
        // If the input is an array, use it. Otherwise, split the input string into an array.
        let layer_init = '0';
        let layer_curr = layer_init;
        let all_layers = new Set(['0']);
        // Prepare layers_set from get_layers
        // 1. Modify get_layers if needed: convert single T to array [0, T]
        if (typeof get_layers === 'number' || typeof get_layers === 'string') {
            get_layers = [get_layers];
        }
        let layers_list = new Set([layer_init]);
        // convert all elements in layers_list to String type
        get_layers.forEach((item, index) => {
            if (typeof item === "number") {
                layers_list.add(item.toString());
            }
        });
        let lvl_ch = ':';
        let spc_ch = ' ';
        let exploder_ch = "\n";
        for (exploder_ch of ["\n", "~", "\r"]) {
            if (src_rows.indexOf(exploder_ch) !== -1) {
                if (exploder_ch === "~" && src_rows.endsWith('~')) {
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
                else if (key === '-+' || key === '-++') {
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
            else if (layers_list.has(layer_curr)) {
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
        if (typeof Buffer !== 'undefined') {
            base64 = Buffer.from(str, 'binary').toString('base64');
        }
        else if (typeof btoa === "function") {
            base64 = btoa(str);
        }
        else {
            throw new Error('Not found me base64-encoder');
        }
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    static base64Udecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        try {
            let decoded;
            if (typeof Buffer !== 'undefined') {
                decoded = Buffer.from(str, 'base64').toString('binary');
            }
            else if (typeof atob === 'function') {
                decoded = atob(str);
            }
            else {
                throw new Error('Not found base64-decoder');
            }
            return decoded;
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
HELML.CUSTOM_FORMAT_DECODER = null;
HELML.CUSTOM_VALUE_DECODER = null;
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
