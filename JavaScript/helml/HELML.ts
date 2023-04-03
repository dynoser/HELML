import type { fakeWindow } from './window.d.ts';

declare var window: fakeWindow;

export default class HELML {
    static ENABLE_BONES: boolean = true; // For encode: enable use "next"-keys like :--:
    static ENABLE_SPC_IDENT: boolean = true; // For encode: add space-indentation at begin of string
    static ENABLE_KEY_UPLINES: boolean = true; // For encode: adding empty string before array-create-keys
    static ENABLE_HASHSYMBOLS: boolean = true; // For encode: adding # after nested-blocks

    static CUSTOM_FORMAT_DECODER: ((value: string, spc_ch: string) => any) | null = null;
    static CUSTOM_VALUE_DECODER: ((value: string, spc_ch: string) => any) | null = null;
    static CUSTOM_VALUE_ENCODER: ((value: string, spc_ch: string) => any) | null = null;
    
    static SPEC_TYPE_VALUES: Record<string, any> = {
        'N': null,
        'U': undefined,
        'T': true,
        'F': false,
        'NAN': NaN,
        'INF': Infinity,
        'NIF': -Infinity
    };

    static encode(arr: any, url_mode = false) {
        let results_arr: string[] = [];

        // Check arr and convert to iterable (if possible)
        arr = HELML.iterablize(arr);

        let str_imp = url_mode ? "~" : "\n";
        let lvl_ch = url_mode ? '.' : ':';
        let spc_ch = url_mode ? '_' : ' ';

        // is the object a list with sequential keys?
        let is_list: boolean = Array.isArray(arr);
        if (!is_list && HELML.ENABLE_BONES) {
            const keys: string[] = Object.keys(arr);
            const expectedNumKeys: string[] = Array.from({ length: keys.length }, (_: any, i: number) => String(i));
            is_list = keys.every((key: any, index: number) => key === expectedNumKeys[index]);
        }

        HELML._encode(arr, results_arr, 0, lvl_ch, spc_ch, is_list);

        if (url_mode && results_arr.length == 1) {
            results_arr.push('');
        }

        return results_arr.join(str_imp);
    }

    static _encode(arr: { [x: string]: any; }, results_arr: { push?: any; }, level = 0, lvl_ch = ":", spc_ch = " ", is_list = false) {

        // Set value encoder function as default valueEncoder or custom user function
        const valueEncoFun = HELML.CUSTOM_VALUE_ENCODER === null ? HELML.valueEncoder : HELML.CUSTOM_VALUE_ENCODER;

        for (let key in arr) {
            let value = arr[key];
    
            if (is_list && HELML.ENABLE_BONES) {
                key = '--';
            } else if (!is_list) {
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
            let ident: string = lvl_ch.repeat(level);

            // add space-ident to the left of the key (if need)
            if (HELML.ENABLE_SPC_IDENT && spc_ch === ' ') {
                ident = spc_ch.repeat(level) + ident;
            }
    
            let is_arr = Array.isArray(value);

            if (value !== null && (is_arr || typeof value === 'object' )) {
                // if the value is an array or iterable, call this function recursively and increase the level
                if (HELML.ENABLE_KEY_UPLINES && spc_ch === ' ') {
                    results_arr.push('');
                }
                results_arr.push(ident + (is_arr ? key + lvl_ch : key));
                value = HELML.iterablize(value);
                HELML._encode(value, results_arr, level + 1, lvl_ch, spc_ch, is_arr);
                if (HELML.ENABLE_HASHSYMBOLS && spc_ch === ' ') {
                    results_arr.push(' '. repeat(level) + '#');
                }
            } else {
                // if the value is not an array, run it through a value encoding function
                value = valueEncoFun(value, spc_ch);
                // add the key:value pair to the output
                results_arr.push(ident + key + lvl_ch + value);
            }
        }
    }
    
    static decode(src_rows: string, layers_list: (string | number)[] = [0]) {
        // Set value decoder function as default valueDecoder or custom user function
        const valueDecoFun = HELML.CUSTOM_VALUE_DECODER === null ? HELML.valueDecoder : HELML.CUSTOM_VALUE_DECODER;

        // If the input is an array, use it. Otherwise, split the input string into an array.
        let layer_init: string = '0';
        let layer_curr: string = layer_init;
        let all_layers = new Set(['0']);
        // convert all elements in layers_list to String type
        layers_list.forEach((item, index) => {
            if (typeof item === "number") {
            layers_list[index] = item.toString();
            }
        });

        let lvl_ch: string = ':';
        let spc_ch: string = ' ';
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

        let str_arr: string[] = src_rows.split(exploder_ch);
    
        // Initialize result array and stack for keeping track of current array nesting
        let result: {[key: string]: any} = {};
        let stack: string[] = [];
    
        let min_level: number = -1;

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
            const firstDiv: number = line.indexOf(lvl_ch);
            let key: string = firstDiv === -1 ? line : line.substring(0, firstDiv);
            let value: string | null = firstDiv === -1 ? null : line.substring(firstDiv + 1);            

            // check min_level
            if (min_level < 0 || min_level > level) {
                min_level = level;
            }

            // Remove keys from the stack if level decreased
            let extra_keys_cnt: number = stack.length - (level - min_level);
            if (extra_keys_cnt > 0) {
                // removing extra keys from stack
                 while(stack.length && extra_keys_cnt--) {
                    stack.pop();
                 }
                 layer_curr = layer_init;
            }
    
            // Find the parent element in the result array for the current key
            let parent: any = result;
            for (let parentKey of stack) {
                parent = parent[parentKey];
            }

            // Decode the key if it starts with an equals sign
            if (key.charAt(0) === '-') {
                if (key === '--' || key === '---') {
                    // Next number keys
                    key = (typeof parent === 'object') ? String(Object.keys(parent).length) : '0';
                } else if (key.startsWith('-+')) {
                    // Layer control keys
                    if (value !== null) {
                        value = value.trim();
                    }
                    if (key === '-++') {
                        layer_init = value ? value : '0'
                        layer_curr = layer_init
                    } else if (key === '-+') {
                        if (value == null) {
                            layer_curr =  Number.isInteger(parseInt(layer_curr)) ? String(layer_curr + 1) : layer_init;
                        } else {
                            layer_curr = (value === '') ? layer_init : value;
                        }
                    }
                    all_layers.add(layer_curr);
                    continue;
                } else {
                    let decoded_key: string | null = HELML.base64Udecode(key.substring(1));
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
            } else if (layers_list.includes(layer_curr)) {
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

    static valueEncoder(value: string | number | null | boolean | number | bigint | undefined, spc_ch = ' ') {
        if (typeof value === 'string') {
            let need_encode: boolean = value.indexOf('~') !== -1;
            let reg_str: { test?: any; };
            if ('_' === spc_ch) {
                // for url-mode: ASCII visible chars only
                reg_str = /^[ -~]+$/;
            } else {
                // utf-8 visible chars
                reg_str = /^[\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]+$/
            }
            if (need_encode || !reg_str.test(value)) {
                // if the string contains special characters, encode it in base64
                return "-" + HELML.base64Uencode(value);
            } else if (!value.length || spc_ch === value[0] || spc_ch === value.slice(-1) || /\s/.test(value.slice(-1))) {
                // for empty strings or those that have spaces at the beginning or end
                return "'" + value + "'";
            } else {
                // if the value is simple, just add one space at the beginning
                return spc_ch + value;
            }
        } else {
            const type = typeof value;
            switch (type) {
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
                        return "-" + HELML.base64Uencode(String(value));
                    }
                    /* falls through */
                case 'bigint':
                    break;
                case 'object':
                    if (value === null) {
                    value = 'N'; break;
                    }
                default:
                    throw new Error(`Cannot encode value of type ${type}`);
            }
        }
        return spc_ch + spc_ch + value;
    }
        
    static valueDecoder(encodedValue: string, spc_ch = ' '): string | number | null | boolean | undefined {
        const fc: string = encodedValue.charAt(0);
        if (spc_ch === fc) {
            if (encodedValue.substring(0, 2) !== spc_ch + spc_ch) {
                // if the string starts with only one space, return the string after it
                return encodedValue.slice(1);
            }
            // if the string starts with two spaces, then it encodes a non-string value
            let slicedValue: string = encodedValue.slice(2); // strip left spaces
            if (slicedValue in HELML.SPEC_TYPE_VALUES) {
                return HELML.SPEC_TYPE_VALUES[slicedValue];
            }
            if (/^-?\d+(.\d+)?$/.test(slicedValue)) {
                // it's probably a numeric value
                if (slicedValue.indexOf('.') !== -1) {
                    // if there's a decimal point, it's a floating point number
                    return parseFloat(slicedValue);
                } else {
                    // if there's no decimal point, it's an integer
                    return parseInt(slicedValue, 10);
                }
            }
            // custom user-defined function
            if (typeof HELML.CUSTOM_FORMAT_DECODER === 'function') {
                return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
            }
            return slicedValue;
        } else if ('"' === fc || "'" === fc) { // it's likely that the string is enclosed in single or double quotes
            encodedValue = encodedValue.slice(1, -1); // trim the presumed quotes at the edges
            return (fc === '"') ? HELML.stripcslashes(encodedValue) : encodedValue;
        } else if ("-" === fc) {
            encodedValue = encodedValue.slice(1);
        } else if (typeof HELML.CUSTOM_FORMAT_DECODER === 'function') {
            return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
        }
        // if there are no spaces or quotes at the beginning, the value should be in base64
        return HELML.base64Udecode(encodedValue);
    }

    static base64Uencode(str: string): string {
        let base64: string;

        if (typeof Buffer !== 'undefined') {
            base64 = Buffer.from(str, 'binary').toString('base64');
        } else if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
            base64 = window.btoa(str);
        } else {
            throw new Error('Not found me base64-encoder');
        }
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
            
    static base64Udecode(str: string): string | null {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
        str += '=';
        }
    
        try {
            let decoded: string;
            if (typeof Buffer !== 'undefined') {
                decoded = Buffer.from(str, 'base64').toString('binary');
            } else if (typeof window !== 'undefined' && typeof window.atob === 'function') {
                decoded = window.atob(str);
            } else {
                throw new Error('Not found base64-decoder');
            }
            return decoded;
        } catch (e) {
            return null;
        }
    }    

    static iterablize<T>(arr: T[] | Iterable<T> | Map<any, T> | Set<T>): T[] | Iterable<T> {
        if (typeof arr[Symbol.iterator] !== 'function') {
            arr[Symbol.iterator] = function* () {
                const entries: [string, any][] = [];
                for (const key in this) {
                    if (this.hasOwnProperty(key)) {
                        entries.push([key, (this as any)[key]]);
                    }
                }
                yield* entries;
            };
            return arr as Iterable<T>;
        } else if (arr instanceof Set || arr instanceof Map) {
            return Array.from(arr.values()) as T[];
        }
        return arr;
    }

    static stripcslashes(str: string): string {
        const controlCharsMap: Record<string, string> = {
        '\\n': '\n',
        '\\t': '\t',
        '\\r': '\r',
        '\\b': '\b',
        '\\f': '\f',
        '\\v': '\v',
        '\\0': '\0',
        '\\\\': '\\'
        };
        return str.replace(/\\(n|t|r|b|f|v|0|\\)/g, (match: string | number) => controlCharsMap[match]);
    }
}