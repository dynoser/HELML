"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HELML {
    /**
     * Encodes the specified array into a HELM.
     * @param {any} arr - The array to encode.
     * @param {number} [one_line_mode=0] - The encoding mode to use:
     *     - 0 - regular multi-line encoding
     *     - 1 - URL encoding with dot and underscore separators
     *     - 2 - single-line encoding with trimmed strings and removed empty and comment lines
     * @returns {string} The encoded HELM-like string.
     */
    static encode(arr, one_line_mode = 0) {
        let results_arr = [];
        // Check arr and convert to iterable (if possible)
        arr = HELML.iterablize(arr);
        // one-line-mode selector
        let str_imp = one_line_mode ? "~" : HELML.EOL;
        let url_mode = one_line_mode === 1;
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
        if (url_mode) {
            results_arr.push('');
        }
        else if (one_line_mode) {
            results_arr = results_arr
                .map((str) => str.trim()) // remove spaces
                .filter((str) => str !== "" && !str.startsWith("#")); // remove all empty strings and comments
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
            else if (!is_list) {
                // encode key in base64url if it contains unwanted characters
                let fc = key.charAt(0);
                let lc = key.charAt(key.length - 1);
                if (key.indexOf(lvl_ch) !== -1 || fc === '#' || fc === spc_ch || fc === ' ' || fc === '' || lc === spc_ch || lc === ' ') {
                    fc = '-';
                }
                else if (!((spc_ch === '_') ? /^[ -}]+$/.test(key) : /^[^\x00-\x1F\x7E-\xFF]+$/.test(key))) {
                    fc = '-';
                }
                if (fc === "-") {
                    // add "-" to the beginning of the key to indicate it's in base64url
                    key = "-" + HELML.base64Uencode(key);
                }
            }
            // add the appropriate number of colons to the left of the key, based on the current level
            let ident = lvl_ch.repeat(level);
            // add space-ident to the left of the key (if need)
            if (HELML.ENABLE_SPC_IDENT && spc_ch === ' ') {
                ident = spc_ch.repeat(level * HELML.ENABLE_SPC_IDENT) + ident;
            }
            let is_arr = Array.isArray(value);
            if (value !== null && (is_arr || typeof value === 'object')) {
                // if the value is an array or iterable, call this function recursively and increase the level
                if (HELML.ENABLE_KEY_UPLINES && spc_ch === ' ') {
                    results_arr.push('');
                }
                if (is_arr && key.charAt(0) !== '-' && /[{}\<\>\(\),\"\'?]/.test(key)) { // Encode list-key
                    key = "-" + HELML.base64Uencode(key);
                }
                results_arr.push(ident + (is_arr ? key : key + lvl_ch));
                value = HELML.iterablize(value);
                HELML._encode(value, results_arr, level + 1, lvl_ch, spc_ch, is_arr);
                if (HELML.ENABLE_HASHSYMBOLS && spc_ch === ' ') {
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
    static decode(src_rows, get_layers = [0]) {
        // Prepare layers_set from get_layers
        // 1. Modify get_layers if needed: convert single T to array [0, T]
        if (typeof get_layers === 'number' || typeof get_layers === 'string') {
            get_layers = [get_layers];
        }
        const layers_list = new Set(['0']);
        // convert all number-elements in layers_list toString
        get_layers.forEach((item, index) => {
            if (typeof item === "number") {
                item = item.toString();
            }
            layers_list.add(item.toString());
        });
        let lvl_ch = ':';
        let spc_ch = ' ';
        let exploder_ch = "\n";
        // 2. Skip "~" and spaces from begin
        let stpos = 0;
        for (; stpos < src_rows.length; stpos++) {
            const ch = src_rows[stpos];
            if (ch !== ' ' && ch !== "\t" && ch != '~')
                break;
        }
        // 3. Detect string divider
        for (exploder_ch of ["\r\n", "\n", "~", "\r"]) {
            if (src_rows.indexOf(exploder_ch, stpos) !== -1) {
                if (exploder_ch === "~" && src_rows.endsWith('~')) {
                    lvl_ch = '.';
                    spc_ch = '_';
                }
                break;
            }
        }
        // 4. Explode string from stpos
        let str_arr = src_rows.substring(stpos).split(exploder_ch);
        return HELML._decode(str_arr, layers_list, lvl_ch, spc_ch);
    }
    static _decode(str_arr, layers_list, lvl_ch, spc_ch) {
        // Set value decoder function as default valueDecoder or custom user function
        const valueDecoFun = HELML.CUSTOM_VALUE_DECODER === null ? HELML.valueDecoder : HELML.CUSTOM_VALUE_DECODER;
        let layer_init = "0";
        let layer_curr = layer_init;
        let all_layers = new Set(['0']);
        // Initialize result array and stack for keeping track of current array nesting
        let result = {};
        let stack = [];
        let min_level = -1;
        // Loop through each line in the input array
        for (let line of str_arr) {
            line = line.trim();
            // Skip empty lines and comment
            if (!line.length || line.charAt(0) === '#' || line.startsWith('//'))
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
                if (key === '--') {
                    // Next number keys
                    key = (typeof parent === 'object') ? String(Object.keys(parent).length) : '0';
                }
                else if (key === '-+' || key === '-++' || key === '---') {
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
                parent[key] = value === null ? [] : {};
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
    static valueEncoder(value, spc_ch = ' ') {
        if (typeof value === 'string') {
            let good_chars;
            if ('_' === spc_ch) {
                // for url-mode: ASCII visible chars only (without ~)
                good_chars = /^[ -}]+$/.test(value);
            }
            else {
                // utf-8 visible chars (without ~ and less than space)
                good_chars = /^[^\x00-\x1F\x7E-\xFF]+$/.test(value);
            }
            if (!good_chars || !value.length) {
                // if the string contains special characters, encode it in base64
                return "-" + HELML.base64Uencode(value);
            }
            else if (spc_ch === value[0] || spc_ch === value.slice(-1) || ' ' === value.slice(-1)) {
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
                    value = value === null || value === void 0 ? void 0 : value.toString();
                    break;
                case 'object':
                    if (value === null) {
                        value = 'N';
                        break;
                    }
                /* falls through */
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
        if (typeof window !== 'undefined') {
            base64 = window.btoa(str);
        }
        else if (typeof Buffer !== 'undefined') {
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
            if (typeof window !== 'undefined') {
                decoded = window.atob(str);
            }
            else if (typeof Buffer !== 'undefined') {
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
HELML.ENABLE_BONES = true; // For encode: enable use "next"-keys like :--:
HELML.ENABLE_SPC_IDENT = 1; // For encode: how many spaces will add at begin of string (*level)
HELML.ENABLE_KEY_UPLINES = true; // For encode: adding empty string before array-create-keys
HELML.ENABLE_HASHSYMBOLS = true; // For encode: adding # after nested-blocks
HELML.CUSTOM_FORMAT_DECODER = null;
HELML.CUSTOM_VALUE_DECODER = null;
HELML.CUSTOM_VALUE_ENCODER = null;
HELML.EOL = "\n"; // only for encoder, decoder will autodetect
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
