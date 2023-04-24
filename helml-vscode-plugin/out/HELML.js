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
        let results_arr = HELML.ADD_PREFIX ? ['~'] : [];
        // Check arr and convert to iterable (if possible)
        arr = HELML.iterablize(arr);
        // one-line-mode selector
        let str_imp = one_line_mode ? "~" : HELML.EOL;
        let url_mode = one_line_mode === 1;
        let lvl_ch = url_mode ? '.' : ':';
        let spc_ch = url_mode ? '=' : ' ';
        // is the object a list with sequential keys?
        let is_list = Array.isArray(arr);
        if (!is_list && HELML.ENABLE_BONES) {
            const keys = Object.keys(arr);
            const expectedNumKeys = Array.from({ length: keys.length }, (_, i) => String(i));
            is_list = keys.every((key, index) => key === expectedNumKeys[index]);
        }
        HELML._encode(arr, results_arr, 0, lvl_ch, spc_ch, is_list);
        if (lvl_ch !== ':' || spc_ch !== ' ' || HELML.ADD_POSTFIX) {
            results_arr.push('#' + lvl_ch + spc_ch + '~');
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
        // Modify get_layers if needed: convert single T to array [0, T]
        if (typeof get_layers === 'number' || typeof get_layers === 'string') {
            get_layers = [0, get_layers];
        }
        // Prepare layers_set from get_layers
        const layers_list = new Set();
        // convert all number-elements to string
        get_layers.forEach(item => {
            if (typeof item === "number") {
                item = item.toString();
            }
            layers_list.add(item.toString());
        });
        let lvl_ch = ':';
        let spc_ch = ' ';
        // Search postfix
        let postfixIndex = src_rows.indexOf('~#'); //~#: ~
        if (postfixIndex >= 0 && src_rows.charAt(postfixIndex + 4) === '~') {
            // get control-chars from postfix
            lvl_ch = src_rows.charAt(postfixIndex + 2);
            spc_ch = src_rows.charAt(postfixIndex + 3);
            // skip prefix
            let stpos = 0;
            for (; stpos < src_rows.length; stpos++) {
                const ch = src_rows[stpos];
                if (ch !== ' ' && ch !== "\t" && ch != '~')
                    break;
            }
            // cut string between prefix and postfix
            src_rows = src_rows.substring(stpos, postfixIndex);
        }
        // Detect line divider
        let exploder_ch = "\n";
        for (exploder_ch of ["\r\n", "\r", "\n"]) {
            if (src_rows.indexOf(exploder_ch) !== -1)
                break;
        }
        // Replace all ~ to line divider
        if (src_rows.indexOf('~') >= 0) {
            src_rows = src_rows.replace(/~/gm, exploder_ch);
        }
        // Explode string to lines
        let str_arr = src_rows.split(exploder_ch);
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
            let key = firstDiv === -1 ? line : line.substring(0, firstDiv).trim();
            let value = firstDiv === -1 ? null : line.substring(firstDiv + 1);
            if (!key.length)
                continue; // skip empty keys
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
        let stpos = (encodedValue.charAt(0) === spc_ch) ? ((encodedValue.charAt(1) === spc_ch) ? 2 : 1) : 0;
        // raw
        if (stpos === 1) {
            return encodedValue.slice(1);
        }
        // special 0
        if (!stpos) {
            const fc = encodedValue.charAt(stpos);
            if (fc === '-') {
                return HELML.base64Udecode(encodedValue.slice(stpos + 1));
            }
            else if (fc === "'") {
                return encodedValue.slice(stpos + 1, -1);
            }
            else if (fc === '"') {
                return HELML.stripcslashes(encodedValue.slice(stpos + 1, -1));
            }
            else if (fc === '%') {
                return HELML.hexDecode(encodedValue.slice(stpos + 1));
            }
        }
        let slicedValue = encodedValue.slice(stpos);
        if (stpos) {
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
            if (slicedValue in HELML.SPEC_TYPE_VALUES) {
                return HELML.SPEC_TYPE_VALUES[slicedValue];
            }
        }
        // custom user-defined function
        if (typeof HELML.CUSTOM_FORMAT_DECODER === 'function') {
            return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
        }
        return encodedValue;
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
            '\\"': '"',
            "\\'": "'",
            '\\\\': '\\'
        };
        return str.replace(/\\(n|t|r|b|f|v|0|\\)/g, (match) => controlCharsMap[match]);
    }
    static hexDecode(str) {
        const hexc = '0123456789abcdefABCDEF';
        let decoded = "";
        for (let i = 0; i < str.length; i++) {
            const fc = str.charAt(i);
            const sc = str.charAt(i + 1);
            if (hexc.indexOf(fc) >= 0 && hexc.indexOf(sc) >= 0) {
                decoded += String.fromCharCode(parseInt(fc + sc, 16));
                i++;
            }
        }
        return decoded;
    }
}
HELML.ENABLE_BONES = true; // For encode: enable use "next"-keys like :--:
HELML.ENABLE_SPC_IDENT = 1; // For encode: how many spaces will add at begin of string (*level)
HELML.ENABLE_KEY_UPLINES = true; // For encode: adding empty string before array-create-keys
HELML.ENABLE_HASHSYMBOLS = true; // For encode: adding # after nested-blocks
HELML.ADD_PREFIX = false;
HELML.ADD_POSTFIX = false;
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
