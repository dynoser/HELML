declare global {
    function btoa(input: string): string;
    function atob(input: string): string;
}

type levelKeyValue = [number, string, any];

export default class HELMLobject implements Iterable<levelKeyValue> {

    public isDecoded = false;

    public CUSTOM_VALUE_DECODER: ((value: string, spc_ch: string) => any) = HELMLobject.valueDecoder;
    static CUSTOM_FORMAT_DECODER: ((value: string, spc_ch: string) => any) | null = null;
    static SPEC_TYPE_VALUES: Record<string, any> = {
        'N': null,
        'U': undefined,
        'T': true,
        'F': false,
        'NAN': NaN,
        'INF': Infinity,
        'NIF': -Infinity
    };

    public lvl_ch: string = ':';
    public spc_ch: string = ' ';

    public str_arr: string[] = [];
    public index: number = 0;
    public min_level: number = -1;

    // layers_set will filled from get_layers in the constructor
    public layers_list = new Set<string>(['0']);
    public all_layers = new Set<string>(['0']);
    public layer_init: string = "0";
    public layer_curr: string = "0";
    
    // Result array and stack for keeping track of current array nesting
    public results: {[key: string]: any} = {};
    public stack: string[] = [];

    public reset() {
        this.index = 0;
        this.results = {};
        this.stack = [];
        this.all_layers = new Set(['0']);
        this.layer_init = '0';
        this.layer_curr = '0';
    }

    [Symbol.iterator](): Iterator<levelKeyValue> {
        if (this.index) {
            this.reset();
        }    
        return this;
    }

    constructor(src_rows: string = '', get_layers: number | string | (string | number)[] = 0) {
        if (get_layers !== 0) {
            this.selectLayers(get_layers);
        }
        if (src_rows) {
            this.addSource(src_rows, true);
        }       
    }
  
    public decode(src_rows: string | undefined = undefined, get_layers: number | string | (string | number)[] = 0) {
        if (get_layers !== 0) {
            this.selectLayers(get_layers);
        }
        if (src_rows) {
            this.addSource(src_rows, true);
        }
        for(const keyVal of this) {

        }
        this.isDecoded = true;
        return this.results;
    }

    public getResults(): Record<string, any> {
        if (!this.isDecoded) {
            this.decode();
        }
        return this.results;
    }

    ///> keypath
    public get(keyPath: string | string[], getPath: boolean = false): any {
        if (typeof keyPath === 'string') {
            keyPath = keyPath.split(':');
        }
        if (!this.isDecoded && !getPath) {
            this.decode();
        }
        const clearPath = [];
        let currArr: any = this.results;
        for (let nextKey of keyPath) {
            nextKey = nextKey.trim();
            if (!nextKey.length) continue;
            if (currArr.hasOwnProperty(nextKey)) {
                currArr = currArr[nextKey];
                if (getPath) {
                    if (typeof currArr !== 'object') {
                        return clearPath;
                    }
                    clearPath.push(nextKey);
                }
            } else {
                return undefined;
            }
        }
        return (getPath) ? clearPath : currArr;
    }
    ///< keypath

    public selectLayers(get_layers: number | string | (string | number)[] = [0]): void {
        // Modify get_layers if needed: convert single T to array [0, T]
        if (typeof get_layers === 'number' || typeof get_layers === 'string') {
            get_layers = [0, get_layers];
        }

        // clear current layers_list
        this.layers_list = new Set<string>();

        // convert all number-elements to string
        get_layers.forEach(item => {
            if (typeof item === "number") {
                item = item.toString();
            }
            this.layers_list.add(item.toString());
        });
        this.isDecoded = false;
    }

    public addSource(src_rows: string, setNew: boolean = false): void {
        // Search postfix
        let postfixIndex = src_rows.indexOf('~#'); //~#: ~
        if (postfixIndex >= 0 && src_rows.charAt(postfixIndex+4) === '~') {
            // get control-chars from postfix
            this.lvl_ch = src_rows.charAt(postfixIndex+2);
            this.spc_ch = src_rows.charAt(postfixIndex+3);

            // skip prefix
            let stpos: number = 0;
            for(; stpos < src_rows.length; stpos++) {
                const ch = src_rows[stpos];
                if (ch !== ' ' && ch !== "\t" && ch != '~') break;
            }

            // cut string between prefix and postfix
            src_rows = src_rows.substring(stpos, postfixIndex);
        }

        // Detect line divider
        let exploder_ch = "\n";
        for (exploder_ch of ["\r\n", "\n", "\r"]) {
            if (src_rows.indexOf(exploder_ch) !== -1) break;
        }
        
        // Replace all ~ to line divider
        if (src_rows.indexOf('~')>=0) {
            src_rows = src_rows.replace(/~/gm, exploder_ch);
        }

        // Explode string to lines
        this.str_arr = setNew ?
            src_rows.split(exploder_ch):
            this.str_arr.concat(src_rows.split(exploder_ch));

        this.isDecoded = false;
    }

    public next():IteratorResult<levelKeyValue> {
        if (this.index >= this.str_arr.length) {
            return { value: undefined, done: true };
        }

        let line = this.str_arr[this.index++].trim();
    
        // Skip empty lines and comment
        if (!line.length || line.charAt(0) === '#' || line.startsWith('//'))
            return {value: [-1, '', ''], done: false};

        ///> keypath
        if (line.startsWith('<<')) {
            let keyPath = this.get(line.substring(2), true);
            if (keyPath) {
                this.stack = keyPath;
            }
            return {value: [keyPath.length, line, keyPath.join(':')], done: false};
        }
        ///< keypath

        // Calculate the level of nesting for the current line by counting the number of colons at the beginning
        let level = 0;
        while (line.charAt(level) === this.lvl_ch) {
            level++;
        }
    
        // If the line has colons at the beginning, remove them from the line
        if (level) {
            line = line.substring(level);
        }

        // Split the line into a key and a value (or null if the line starts a new array)
        const firstDiv: number = line.indexOf(this.lvl_ch);
        let key: string = firstDiv === -1 ? line : line.substring(0, firstDiv).trim();
        let value: string | null = firstDiv === -1 ? null : line.substring(firstDiv + 1);            

        if (!key.length) // skip empty key lines
            return {value: [level, '', ''], done: false};

        // check min_level
        if (this.min_level < 0 || this.min_level > level) {
            this.min_level = level;
        }

        // Remove keys from the stack if level decreased
        let extra_keys_cnt: number = this.stack.length - (level - this.min_level);
        if (extra_keys_cnt > 0) {
            // removing extra keys from stack
            while(this.stack.length && extra_keys_cnt--) {
                this.stack.pop();
            }
            this.layer_curr = this.layer_init;
        }
    
        // Find the parent element in the result array for the current key
        let parent: any = this.results;
        for (let parentKey of this.stack) {
            parent = parent[parentKey];
        }

        // Decode the key if it starts with an equals sign
        if (key.charAt(0) === '-') {
            if (key === '--') {
                // Next number keys
                key = (typeof parent === 'object') ? String(Object.keys(parent).length) : '0';
            } else if (key === '-+' || key === '-++' || key === '---') {
                // Layer control keys
                if (value !== null) {
                    value = value.trim();
                }
                if (key === '-++') {
                    this.layer_init = value ? value : '0'
                    this.layer_curr = this.layer_init
                } else if (key === '-+') {
                    if (value == null) {
                        this.layer_curr =  Number.isInteger(parseInt(this.layer_curr)) ? String(this.layer_curr + 1) : this.layer_init;
                    } else {
                        this.layer_curr = (value === '') ? this.layer_init : value;
                    }
                }
                this.all_layers.add(this.layer_curr);
                return {value: [level, key, value], done: false};
            } else {
                let decoded_key: string | null = HELMLobject.base64Udecode(key.substring(1));
                if (decoded_key !== null) {
                    key = decoded_key;
                }
            }
        }

        // If the value is null, start a new array and add it to the parent array
        if (value === null || value === '') {
            parent[key] = value === null ?  [] : {};
            this.stack.push(key);
            this.layer_curr = this.layer_init;
        } else if (this.layers_list.has(this.layer_curr)) {
            // Decode the value by current decoder function and add the key-value pair to the current array
            value = this.CUSTOM_VALUE_DECODER(value, this.spc_ch);
            parent[key] = value;
        }
        return {value: [level, key, value], done: false};
    }

    static valueDecoder(encodedValue: string, spc_ch = ' '): string | number | null | boolean | undefined {
        let stpos = (encodedValue.charAt(0) === spc_ch) ? ((encodedValue.charAt(1) === spc_ch) ? 2 : 1) : 0;

        // raw
        if (stpos === 1) {
            return encodedValue.slice(1);
        }

        // special 0
        if (!stpos) {
            const fc: string = encodedValue.charAt(stpos);

            if (fc === '-') {
                return HELMLobject.base64Udecode(encodedValue.slice(stpos + 1));
            }

            else if (fc === "'") {
                return encodedValue.slice(stpos + 1, -1);
            }
            
            else if (fc === '"') {
                return HELMLobject.stripcslashes(encodedValue.slice(stpos + 1, -1));
            }

            else if (fc === '%') {
                return HELMLobject.hexDecode(encodedValue.slice(stpos + 1));
            }
        }

        let slicedValue = encodedValue.slice(stpos);

        if (stpos) {
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

            if (slicedValue in HELMLobject.SPEC_TYPE_VALUES) {
                return HELMLobject.SPEC_TYPE_VALUES[slicedValue];
            }
        }

        // custom user-defined function
        if (typeof HELMLobject.CUSTOM_FORMAT_DECODER === 'function') {
            return HELMLobject.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch);
        }

        return encodedValue;
    }

    static base64Uencode(str: string): string {
        let base64: string;

        if (typeof Buffer !== 'undefined') {
            base64 = Buffer.from(str, 'binary').toString('base64');
        } else if (typeof btoa === "function") {
            base64 = btoa(str);
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
            } else if (typeof atob === 'function') {
                decoded = atob(str);
            } else {
                throw new Error('Not found base64-decoder');
            }
            return decoded;
        } catch (e) {
            return null;
        }
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
        '\\"': '"',
        "\\'": "'",
        '\\\\': '\\'
        };
        return str.replace(/\\(n|t|r|b|f|v|0|\\)/g, (match: string | number) => controlCharsMap[match]);
    }

    static hexDecode(encoded: string): string | null {
        const hexc1 = '0123456789abcdefABCDEF';
        const hexc2 = hexc1 + ' ';
        let decoded = "";
        for (let i = 0; i < encoded.length; i++) {
            const fc = encoded.charAt(i);
            const sc = encoded.charAt(i+1);
            if (hexc1.indexOf(fc) >= 0 && hexc2.indexOf(sc) >= 0) {
                decoded += String.fromCharCode(parseInt(fc + sc, 16));
                i++;
            }
        }
        return decoded;
    }
}