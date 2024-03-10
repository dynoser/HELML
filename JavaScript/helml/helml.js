/* VEZDES:

 :URL
  ::--: https://raw.githubusercontent.com/dynoser/vezdes/main/src/HELML.ts
  ::--: https://raw.githubusercontent.com/dynoser/HELML/master/helml-vscode-plugin/src/HELML.ts
 #
 :TIME:  1709832700
 :PUBKEY: aOk1rVVhWoaYZzThCNWiaBMGeaQMJ_hAZT-HTGfZkKY
 :HASH: eQC9BLuHzBP0QCFjBRrf3S20rP0uPO6Anxc3ek9_vpk
 :SIGNATURE: RYu-NZJXHC2ZVHjIvddQlO67VVAkobUM0WZ8XjNMKzBPKrW2RoJ-7TEXEtG5E31P5QixvE1_ZBPwM2bqC4JKCg
# /VEZDES */
class HELML {
    /**
     * Encodes the specified array into a HELM.
     * @param {any} inArr - The array to encode.
     * @param {number} [oneLineMode=0] - The encoding mode to use:
     *     - 0 - regular multi-line encoding
     *     - 1 - URL encoding with . and = separators
     *     - 2 - single-line encoding with trimmed strings and removed empty and comment lines
     * @returns {string} The encoded HELM-like string.
     */
    static encode(inArr, oneLineMode = 0) {
        let outArr = HELML.ADD_PREFIX ? ['~'] : [];
        // Check arr and convert to iterable (if possible)
        inArr = HELML.iterablize(inArr);
        // one-line-mode selector
        let strImp = oneLineMode ? "~" : HELML.EOL;
        let urlMode = oneLineMode === 1;
        let lvlCh = urlMode ? HELML.URL_LVL : ':';
        let spcCh = urlMode ? HELML.URL_SPC : ' ';
        // is the object a list with sequential keys?
        let is_list = Array.isArray(inArr);
        if (!is_list && HELML.ENABLE_BONES) {
            const keys = Object.keys(inArr);
            const expectedNumKeys = Array.from({ length: keys.length }, (_, i) => String(i));
            is_list = keys.every((key, index) => key === expectedNumKeys[index]);
        }
        HELML._encode(inArr, outArr, 0, lvlCh, spcCh, is_list);
        let needAddPostfix = HELML.ADD_POSTFIX;
        if (oneLineMode) {
            needAddPostfix = needAddPostfix || lvlCh !== HELML.URL_LVL || spcCh !== HELML.URL_SPC;
            // skip empty lines and #-comments
            const newArr = HELML.ADD_PREFIX ? [] : [''];
            outArr.forEach((el) => {
                const st = el.trim();
                if (st.length > 0 && st[0] !== '#') {
                    newArr.push(st.replace(/\n/g, strImp)); // replace "\n" to strImp
                }
            });
            if (urlMode && !needAddPostfix) {
                newArr.push('');
            }
            outArr = newArr;
        }
        else {
            needAddPostfix = needAddPostfix || lvlCh !== ':' || spcCh !== ' ';
        }
        if (needAddPostfix) {
            outArr.push('~#' + lvlCh + spcCh + '~');
        }
        return outArr.join(strImp);
    }
    static _encode(inArr, outArr, level = 0, lvlCh = ":", spcCh = " ", isList = false) {
        // Set value encoder function as default valueEncoder or custom user function
        const valueEncoFun = HELML.CUSTOM_VALUE_ENCODER === null ? HELML.valueEncoder : HELML.CUSTOM_VALUE_ENCODER;
        for (let key in inArr) {
            let value = inArr[key];
            if (isList && HELML.ENABLE_BONES) {
                key = '--';
            }
            else if (!isList) {
                // encode key in base64url if it contains unwanted characters
                let fc = key.charAt(0);
                let lc = key.charAt(key.length - 1);
                if ((fc === '#' && !level) || fc === spcCh || fc === ' ' || fc === '' || lc === spcCh || lc === ' ' || key.indexOf(lvlCh) !== -1 || key === '<<' || key === '>>') {
                    fc = '-';
                }
                else if (!((spcCh === HELML.URL_SPC) ? /^[ -}]+$/.test(key) : /^[^\x00-\x1F\x7E-\xFF]+$/.test(key))) {
                    fc = '-';
                }
                if (fc === "-") {
                    // add "-" to the beginning of the key to indicate it's in base64url
                    key = "-" + HELML.base64Uencode(key);
                }
            }
            // add the appropriate number of colons to the left of the key, based on the current level
            let ident = lvlCh.repeat(level);
            // add space-ident to the left of the key (if need)
            if (HELML.ENABLE_SPC_IDENT && spcCh === ' ') {
                ident = spcCh.repeat(level * HELML.ENABLE_SPC_IDENT) + ident;
            }
            let isArr = Array.isArray(value);
            if (value !== null && (isArr || typeof value === 'object')) {
                // if the value is an array or iterable, call this function recursively and increase the level
                if (HELML.ENABLE_KEY_UPLINES && spcCh === ' ') {
                    outArr.push('');
                }
                if (isArr && key.charAt(0) !== '-' && /[{}\<\>\(\),\"\'?]/.test(key)) { // Encode list-key
                    key = "-" + HELML.base64Uencode(key);
                }
                outArr.push(ident + (isArr ? key : key + lvlCh));
                value = HELML.iterablize(value);
                HELML._encode(value, outArr, level + 1, lvlCh, spcCh, isArr);
                if (HELML.ENABLE_HASHSYMBOLS && spcCh === ' ') {
                    outArr.push(' '.repeat(level) + '#');
                }
            }
            else {
                // if the value is not an array, run it through a value encoding function
                value = valueEncoFun(value, spcCh);
                // add the key:value pair to the output
                outArr.push(ident + key + lvlCh + value);
            }
        }
    }
    static decode(srcRows, getLayers = [0]) {
        // Modify get_layers if needed: convert single T to array [0, T]
        if (typeof getLayers === 'number' || typeof getLayers === 'string') {
            getLayers = [0, getLayers];
        }
        // Prepare layers_set from get_layers
        const layersList = new Set();
        // convert all number-elements to string
        getLayers.forEach(item => {
            if (typeof item === "number") {
                item = item.toString();
            }
            layersList.add(item.toString());
        });
        let lvlCh = ':';
        let spcCh = ' ';
        let rowsArr;
        if (typeof srcRows === 'string') {
            // Search postfix
            let postfixIndex = srcRows.indexOf('~#'); //~#: ~
            if (postfixIndex >= 0 && srcRows.charAt(postfixIndex + 4) === '~') {
                // get control-chars from postfix
                lvlCh = srcRows.charAt(postfixIndex + 2);
                spcCh = srcRows.charAt(postfixIndex + 3);
                // skip prefix
                let stpos = 0;
                for (; stpos < srcRows.length; stpos++) {
                    const ch = srcRows[stpos];
                    if (ch !== ' ' && ch !== "\t" && ch != '~')
                        break;
                }
                // cut string between prefix and postfix
                srcRows = srcRows.substring(stpos, postfixIndex);
            }
            // Detect line divider
            let ChEOL = "\n";
            for (ChEOL of ["\r\n", "\r", "\n"]) {
                if (srcRows.indexOf(ChEOL) !== -1)
                    break;
            }
            // Replace all ~ to line divider
            if (srcRows.indexOf('~') >= 0) {
                srcRows = srcRows.replace(/~/gm, ChEOL);
            }
            // Explode string to lines
            rowsArr = srcRows.split(ChEOL);
        }
        else {
            rowsArr = srcRows;
        }
        return HELML._decode(rowsArr, layersList, lvlCh, spcCh);
    }
    static _decode(strArr, layersList, lvlCh, spcCh) {
        // Set value decoder function as default valueDecoder or custom user function
        const valueDecoFun = HELML.CUSTOM_VALUE_DECODER === null ? HELML.valueDecoder : HELML.CUSTOM_VALUE_DECODER;
        let layerInit = "0";
        let layerCurr = layerInit;
        let allLayers = new Set(['0']);
        // Initialize result array and stack for keeping track of current array nesting
        let result = {};
        let stack = [];
        let minLevel = -1;
        let baseLevel = 0;
        // Loop through each line in the input array
        const linesCnt = strArr.length;
        for (let lNum = 0; lNum < linesCnt; lNum++) {
            let line = strArr[lNum].trim();
            // Skip empty lines and comment
            if (!line.length || line.charAt(0) === '#' || line.startsWith('//'))
                continue;
            // Calculate the level of nesting for the current line by counting the number of colons at the beginning
            let level = 0;
            while (line.charAt(level) === lvlCh) {
                level++;
            }
            // If the line has colons at the beginning, remove them from the line
            if (level) {
                line = line.substring(level);
            }
            // Split the line into a key and a value (or null if the line starts a new array)
            const firstDiv = line.indexOf(lvlCh);
            let key = firstDiv === -1 ? line : line.substring(0, firstDiv).trim();
            let value = firstDiv === -1 ? null : line.substring(firstDiv + 1);
            // base_level mod
            level += baseLevel;
            if (!value) {
                if (key === '<<') {
                    baseLevel && baseLevel--;
                    continue;
                }
                else if (key === '>>') {
                    baseLevel++;
                    continue;
                }
            }
            else if (value === '>>') {
                baseLevel++;
                value = '';
            }
            if (!key.length)
                continue; // skip empty keys
            // check min_level
            if (minLevel < 0 || minLevel > level) {
                minLevel = level;
            }
            // Remove keys from the stack if level decreased
            let extraKeysCnt = stack.length - level + minLevel;
            if (extraKeysCnt > 0) {
                // removing extra keys from stack
                while (stack.length && extraKeysCnt--) {
                    stack.pop();
                }
                layerCurr = layerInit;
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
                        layerInit = value ? value : '0';
                        layerCurr = layerInit;
                    }
                    else if (key === '-+') {
                        if (value == null) {
                            layerCurr = Number.isInteger(parseInt(layerCurr)) ? String(layerCurr + 1) : layerInit;
                        }
                        else {
                            layerCurr = (value === '') ? layerInit : value;
                        }
                    }
                    allLayers.add(layerCurr);
                    continue;
                }
                else {
                    let decodedKey = HELML.base64Udecode(key.substring(1));
                    if (decodedKey !== null) {
                        key = decodedKey;
                    }
                }
            }
            // If the value is null, start a new array and add it to the parent array
            if (value === null || value === '') {
                parent[key] = value === null ? [] : {};
                stack.push(key);
                layerCurr = layerInit;
            }
            else if (layersList.has(layerCurr)) {
                if (value === '`') {
                    let mulVal = [];
                    let cln = lNum + 1;
                    for (; cln < linesCnt; cln++) {
                        line = strArr[cln].replace(/[\r\n\x00]/g, '');
                        if (line.trim() === '`') {
                            lNum = cln;
                            break;
                        }
                        mulVal.push(line);
                    }
                    value = (lNum === cln) ? mulVal.join("\n") : '`ERR`';
                }
                else {
                    // Decode the value by current decoder function and add the key-value pair to the current array
                    value = valueDecoFun(value, spcCh);
                }
                parent[key] = value;
            }
        }
        if (allLayers.size > 1) {
            result['_layers'] = Array.from(allLayers);
        }
        // Return the result array
        return result;
    }
    static valueEncoder(value, spcCh = ' ') {
        if (typeof value === 'string') {
            if ('' === value) {
                return '-';
            }
            let goodChars;
            if ('_' === spcCh) {
                // for url-mode: ASCII visible chars only (without ~)
                goodChars = /^[ -}]+$/.test(value);
            }
            else {
                //goodChars = /^[^\x00-\x1F\x7E-\xFF]+$/.test(value);
                // utf-8 visible chars (without ~ , but with \t \n \r)
                goodChars = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]+$/.test(value);
                const haveCRorLF = value.includes('\n') || value.includes('\r');
                if (haveCRorLF && goodChars) {
                    if (spcCh === ' ' && !/\`\x0d|\`\x0a/.test(value)) {
                        return "`\n" + value + "\n`";
                    }
                    goodChars = false;
                }
            }
            if (!goodChars) {
                // if the string contains special characters, encode it in base64
                return "-" + HELML.base64Uencode(value);
            }
            else if (spcCh === value[0] || spcCh === value.slice(-1) || ' ' === value.slice(-1)) {
                // if have spaces at the beginning or end
                return "'" + value + "'";
            }
            else {
                // if the value is simple, just add one space at the beginning
                return spcCh + value;
            }
        }
        else {
            const typeV = typeof value;
            switch (typeV) {
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
                    else if ('_' === spcCh && !Number.isInteger(value)) {
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
                    throw new Error(`Cannot encode value of type ${typeV}`);
            }
        }
        return spcCh + spcCh + value;
    }
    static valueDecoder(encodedValue, spcCh = ' ') {
        let stPos = (encodedValue.charAt(0) === spcCh) ? ((encodedValue.charAt(1) === spcCh) ? 2 : 1) : 0;
        // raw
        if (stPos === 1) {
            return encodedValue.slice(1);
        }
        // special 0
        if (!stPos) {
            const fc = encodedValue.charAt(stPos);
            if (fc === '-') {
                return HELML.base64Udecode(encodedValue.slice(stPos + 1));
            }
            else if (fc === "'") {
                return encodedValue.slice(stPos + 1, -1);
            }
            else if (fc === '"') {
                return HELML.stripcslashes(encodedValue.slice(stPos + 1, -1));
            }
            else if (fc === '%') {
                return HELML.hexDecode(encodedValue.slice(stPos + 1));
            }
        }
        let slicedValue = encodedValue.slice(stPos);
        if (stPos) {
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
            return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spcCh);
        }
        return encodedValue;
    }
    static base64Uencode(str, urlMode = true) {
        let base64;
        if (typeof window !== 'undefined') {
            base64 = window.btoa(str);
        }
        else if (typeof Buffer !== 'undefined') {
            try {
                const buf = Buffer.from(str, 'utf-8');
                buf.toString('utf-8');
                base64 = buf.toString('base64');
            }
            catch (error) {
                base64 = Buffer.from(str).toString('base64');
            }
        }
        else if (typeof btoa === "function") {
            base64 = btoa(str);
        }
        else {
            throw new Error('Not found base64-encoder');
        }
        return urlMode ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : base64;
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
                decoded = Buffer.from(str, 'base64').toString('utf-8');
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
        const hexArr = [];
        const l = str.length;
        const regex = /^[0-9a-fA-F]$/;
        for (let i = 0; i < l; i++) {
            const ch1 = str[i];
            if (regex.test(ch1)) {
                const ch2 = str[i + 1];
                if (regex.test(ch2)) {
                    hexArr.push(ch1 + ch2);
                    i++;
                }
                else {
                    hexArr.push('0' + ch1);
                }
            }
        }
        if (typeof Buffer !== 'undefined') {
            try {
                const decodedText = Buffer.from(hexArr.join(''), 'hex').toString('utf-8');
                return decodedText;
            }
            catch (e) {
            }
        }
        let decoded = "";
        for (let ch2 of hexArr) {
            decoded += String.fromCharCode(parseInt(ch2, 16));
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
HELML.ENABLE_DBL_KEY_ARR = false; // Enable auto-create array when key already exists
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
HELML.URL_SPC = '=';
HELML.URL_LVL = '.';
export default HELML;
