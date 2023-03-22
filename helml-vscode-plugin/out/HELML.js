class HELML {
    static SPEC_TYPE_VALUES = {
        'N': null,
        'U': undefined,
        'T': true,
        'F': false,
        'NAN': NaN,
        'INF': Infinity,
        'NIF': -Infinity
    };

    static CUSTOM_FORMAT_DECODER = null;
    static CUSTOM_VALUE_ENCODER = null;
    static CUSTOM_VALUE_DECODER = null;

    static ENABLE_BONES = true; // Enable use "next"-keys like :--:

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
        return results_arr.join(str_imp);
    }

    static _encode(arr, results_arr, level = 0, lvl_ch = ":", spc_ch = " ", is_list = false) {

        // Set value encoder function as default valueEncoder or custom user function
        const valueEncoFun = HELML.CUSTOM_VALUE_ENCODER === null ? HELML.valueEncoder : HELML.CUSTOM_VALUE_ENCODER;

        for (let key in arr) {
            let value = arr[key];
    
            if (is_list && HELML.ENABLE_BONES) {
                key = '--';
            } else {
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
            key = lvl_ch.repeat(level) + key;
    
            let is_arr = Array.isArray(value);

            if (value !== null && (is_arr || typeof value === 'object' )) {
                // if the value is an array or iterable, call this function recursively and increase the level
                results_arr.push(is_arr ? key + ":" : key);
                value = HELML.iterablize(value);
                HELML._encode(value, results_arr, level + 1, lvl_ch, spc_ch, is_arr);
            } else {
                // if the value is not an array, run it through a value encoding function
                value = valueEncoFun(value, spc_ch);
                // add the key:value pair to the output
                results_arr.push(key + lvl_ch + value);
            }
        }
    }
    
    static decode(src_rows) {
        // Set value decoder function as default valueDecoder or custom user function
        const valueDecoFun = HELML.CUSTOM_VALUE_DECODER === null ? HELML.valueDecoder : HELML.CUSTOM_VALUE_DECODER;

        // If the input is an array, use it. Otherwise, split the input string into an array.
        let str_arr;
        let lvl_ch = ':';
        let spc_ch = ' ';

        if (typeof src_rows === 'object') {
            str_arr = HELML.iterablize(src_rows);
        } else if (typeof src_rows === "string") {
            let exploder_ch;
            for (exploder_ch of ["\n", "~", "\r"]) {
                if (src_rows.indexOf(exploder_ch) !== -1) break;
            }
            str_arr = src_rows.split(exploder_ch);
            if (exploder_ch === "~") {
                lvl_ch = '.';
                spc_ch = '_';
            }
        } else {
            try {
                str_arr = Array.from(src_rows);
            } catch (e) {
                throw new Error("Iterable object or String required");
            }
        }
    
        // Initialize result array and stack for keeping track of current array nesting
        let result = {};
        let stack = [];
    
        // Loop through each line in the input array
        for (let line of str_arr) {
            line = line.trim();
    
            // Skip empty lines and comment lines starting with '#'
            if (!line.length || line.charAt(0) === '#') continue;
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

            // Remove keys from the stack until it matches the current level
            while (stack.length > level) {
                stack.pop();
            }
    
            // Find the parent element in the result array for the current key
            let parent = result;
            for (let parentKey of stack) {
                parent = parent[parentKey];
            }

            // Decode the key if it starts with an equals sign
            if (typeof key === "string" && key.charAt(0) === '-') {
                if (key === '--' || key === '---') {
                    // The bone-key means "next number". Bone keys like :--: 
                    key = (typeof parent === 'object') ? Object.keys(parent).length : 0;
                } else {
                    let decoded_key = HELML.base64Udecode(key.substring(1));
                    if (false !== decoded_key) {
                        key = decoded_key;
                    }
                }
            }        
    
            // If the value is null, start a new array and add it to the parent array
            if (value === null || value === '') {
                parent[key] = value === '' ? [] : {};
                stack.push(key);
            } else {
                // Decode the value by current decoder function
                value = valueDecoFun(value, spc_ch);
                // Add the key-value pair to the current array
                parent[key] = value;
            }
        }
    
        // Return the result array
        return result;
    }

    static valueEncoder(value, spc_ch = ' ') {
        const type = typeof value;
        switch (type) {
            case 'string':
                let need_encode, reg_str;
                if ('_' === spc_ch) {
                    // for url-mode
                    need_encode = (value.indexOf('~') !== -1);
                    // ASCII visible chars
                    reg_str = /^[ -~]+$/;
                } else {
                    need_encode = false;
                    // utf-8 visible chars
                    reg_str = /^[\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]+$/
                }
                if (need_encode || !reg_str.test(value) || ('_' === spc_ch && value.indexOf('~') !== -1)) {
                    // if the string contains special characters, encode it in base64
                    return HELML.base64Uencode(value);
                } else if (!value.length || spc_ch === value[0] || spc_ch === value.slice(-1) || /\s/.test(value.slice(-1))) {
                    // for empty strings or those that have spaces at the beginning or end
                    return "'" + value + "'";
                } else {
                    // if the value is simple, just add one space at the beginning
                    return spc_ch + value;
                }
            case 'boolean':
                value = (value ? 'T' : 'F'); break;
            case 'undefined':
                value = 'U'; break;
            case 'number':
                if (value === Infinity) {
                    value = "INF";
                } else if (value === -Infinity) {
                    value = "NIF";
                } else if (Number.isNaN(value)) {
                    value = "NAN";
                } else if ('_' === spc_ch && !Number.isInteger(value)) {
                    // for url-mode because dot-inside
                    return HELML.base64Uencode(value);
                }
                /* falls through */
            case 'bigint':
                break;
            case 'null': // type of "null" is "object"
            case 'object':
                if (value === null) {
                   value = 'N'; break;
                }
            default:
                throw new Error(`Cannot encode value of type ${type}`);
        }
        return spc_ch + spc_ch + value;
    }
        
    static valueDecoder(encodedValue, spc_ch = ' ') {
        const fc = encodedValue.charAt(0);
        if (spc_ch === fc) {
            if (encodedValue.substr(0, 2) !== spc_ch + spc_ch) {
                // if the string starts with only one space, return the string after it
                return encodedValue.slice(1);
            }
            // if the string starts with two spaces, then it encodes a non-string value
            encodedValue = encodedValue.slice(2); // strip left spaces
            if (encodedValue in HELML.SPEC_TYPE_VALUES) {
                return HELML.SPEC_TYPE_VALUES[encodedValue];
            }
            if (/^-?\d+(.\d+)?$/.test(encodedValue)) {
                // it's probably a numeric value
                if (encodedValue.indexOf('.') !== -1) {
                    // if there's a decimal point, it's a floating point number
                    return parseFloat(encodedValue);
                } else {
                    // if there's no decimal point, it's an integer
                    return parseInt(encodedValue, 10);
                }
            }
            // custom user-defined function
            if (typeof HELML.CUSTOM_FORMAT_DECODER === 'function') {
                return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
            }
            return encodedValue;
        } else if ('"' === fc || "'" === fc) { // it's likely that the string is enclosed in single or double quotes
            return encodedValue.slice(1, -1); // trim the presumed quotes at the edges and return the interior
        }
        // if there are no spaces or quotes at the beginning, the value should be in base64
        return HELML.base64Udecode(encodedValue);
    }

    static base64Uencode(str) {
        let base64;
    
        if (typeof window === 'undefined') {
            // For Node.js environment
            base64 = Buffer.from(str, 'binary').toString('base64');
        } else {
            // For browser environment
            const encoder = new TextEncoder('utf-8');
            const data = encoder.encode(str);
            base64 = btoa(String.fromCharCode(...data));
        }
    
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
            
    static base64Udecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
    
        try {
            if (typeof window === 'undefined') {
                // For Node.js environment
                return Buffer.from(str, 'base64').toString('binary');
            } else {
                // For browser environment
                const data = Uint8Array.from(atob(str), c => c.charCodeAt(0));
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(data);
            }
        } catch (e) {
            return false;
        }
    }

    static iterablize(arr) {
        if (typeof arr[Symbol.iterator] !== 'function') {
            if (typeof arr !== 'object') {
                throw new Error("Array or iterable object required");
            }
            arr[Symbol.iterator] = function* () {
                const entries = [];
                for (const key in this) {
                  if (this.hasOwnProperty(key)) {
                    entries.push([key, this[key]]);
                  }
                }
                yield* entries;
              };
        }
        return arr;
    }
    
}    

module.exports = HELML;
