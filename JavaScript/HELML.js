class HELML {
    static encode(arr, url_mode = false, val_encoder = true) {
        let results_arr = [];

        // Check arr and convert to iterable (if possible)
        arr = HELML.iterablize(arr);

        let str_imp = url_mode ? "~" : "\n";
        let lvl_ch = url_mode ? '.' : ':';
        let spc_ch = url_mode ? '_' : ' ';
        HELML._encode(arr, results_arr, val_encoder, 0, lvl_ch, spc_ch);
        return results_arr.join(str_imp);
    }

    static _encode(arr, results_arr, val_encoder = true, level = 0, lvl_ch = ":", spc_ch = " ") {
        for (let key in arr) {
            let value = arr[key];
    
            // encode key in base64url if it contains unwanted characters
            let fc = key.charAt(0);
            let lc = key.charAt(key.length - 1);
            if (key.indexOf(lvl_ch) !== -1 || key.indexOf('~') !== -1 || fc === '#' || fc === spc_ch || fc === ' ') {
                fc = "-";
            }
            if (fc === "-" || lc === spc_ch || lc === ' ' || !/^[ -~]+$/.test(key)) {
                // add "-" to the beginning of the key to indicate it's in base64url
                key = "-" + HELML.base64Uencode(key);
            }
    
            // add the appropriate number of colons to the left of the key, based on the current level
            key = lvl_ch.repeat(level) + key;
    
            if (Array.isArray(value) || typeof value === 'object') {
                // if the value is an array or iterable, call this function recursively and increase the level
                value = HELML.iterablize(value);
                results_arr.push(key);
                HELML._encode(value, results_arr, val_encoder, level + 1, lvl_ch, spc_ch);
            } else {
                // if the value is not an array, run it through a value encoding function, if one is specified
                if (val_encoder === true) {
                    value = HELML.valueEncoder(value, spc_ch); // Default value encoder
                } else if (val_encoder) {
                    value = val_encoder(value);
                }
                // add the key:value pair to the output
                results_arr.push(key + lvl_ch + value);
            }
        }
    }
    
    static decode(src_rows, val_decoder = true) {
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
                str_arr = Array.from(arr);
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
            let parts = line.split(lvl_ch, 2);
            let key = parts[0] ? parts[0] : 0;
            let value = parts[1] !== undefined ? parts[1] : null;
    
            // Decode the key if it starts with an equals sign
            if (typeof key === "string" && key.charAt(0) === '-') {
                key = HELML.base64Udecode(key.substring(1));
                if (!key) {
                    key = "ERR";
                }
            }
    
            // Remove keys from the stack until it matches the current level
            while (stack.length > level) {
                stack.pop();
            }
    
            // Find the parent element in the result array for the current key
            let parent = result;
            for (let parentKey of stack) {
                parent = parent[parentKey];
            }
    
            // If the value is null, start a new array and add it to the parent array
            if (value === null) {
                parent[key] = [];
                stack.push(key);
            } else {
                // Decode the value if a decoder function is specified
                if (val_decoder === true) {
                    value = HELML.valueDecoder(value, spc_ch);
                } else if (val_decoder) {
                    value = val_decoder(value, spc_ch);
                }
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
                return spc_ch + spc_ch + (value ? 'T' : 'F');
            case 'undefined':
                return spc_ch + spc_ch + 'U';
            case 'null':
                return spc_ch + spc_ch + 'N';
            case 'number':
                if ('_' === spc_ch) {
                    // for url-mode because dot-inside
                    return HELML.base64Uencode(value);
                }
                // if not url mode, go below
            case 'bigint':
                return spc_ch + spc_ch + value;
            default:
                throw new Error("Cannot encode value of type ${type}");
        }
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
            if (encodedValue === 'N') {
                return null;
            } else if (encodedValue === 'T') {
                return true;
            } else if (encodedValue === 'F') {
                return false;
            } else if (encodedValue === 'NaN') {
                return NaN;
            } else if (encodedValue === 'U') {
                return undefined;
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
            // other encoding options are not currently supported
            return encodedValue;
        } else if ('"' === fc || "'" === fc) { // it's likely that the string is enclosed in single or double quotes
            return encodedValue.slice(1, -1); // trim the presumed quotes at the edges and return the interior
        }
        // if there are no spaces or quotes at the beginning, the value should be in base64
        return HELML.base64Udecode(encodedValue);
    }
        

    static base64Uencode(str) {
        let base64 = btoa(str);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

            
    static base64Udecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        try {
            return atob(str);
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
