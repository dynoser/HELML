import base64
import re
from typing import List, Dict, Set, Union, Callable

class HELML:

    SPEC_TYPE_VALUES = {
        'N': None,
        'U': None,
        'T': True,
        'F': False,
        'NAN': float('nan'),
        'INF': float('inf'),
        'NIF': float('-inf')
    }

    CUSTOM_FORMAT_DECODER = None
    CUSTOM_VALUE_ENCODER = None
    CUSTOM_VALUE_DECODER = None
    
    ENABLE_SPC_IDENT = 1 # For encode: add space-indentation at begin of string
    ENABLE_BONES = True # For encode: enable use "next"-keys like :--:
    ENABLE_KEY_UPLINES = True # For encode: add empty line before create-array-keys
    ENABLE_HASHSYMBOLS = True # For encode: adding # after nested-blocks
    ADD_PREFIX = False
    ADD_POSTFIX = False

    @staticmethod
    def encode(
        arr: Union[dict, list, tuple, set],
        one_line_mode: int = 0
    ) -> str:
        """
        Encode array to HELML string.

        :param arr: Input data structure (list, dict, or tuple) to be encoded.
        :param one_line_mode: The encoding mode to use (0-multi-line, 1-URL-mode, 2-LINE-mode)
        :return: Encoded HELML string.
        """
        results_arr = []

        str_imp = "~" if one_line_mode else "\n"
        url_mode = one_line_mode == 1
        lvl_ch = "." if url_mode else ":"
        spc_ch = "=" if url_mode else " "

        is_list = HELML.num_keys_cnt(arr)
        
        HELML._encode(arr, results_arr, 0, lvl_ch, spc_ch, is_list)

        if lvl_ch != ':' or spc_ch != ' ' or HELML.ADD_POSTFIX:
            results_arr.append('#' + lvl_ch + spc_ch + '~')
        elif one_line_mode:
            # Remove whitespace from beginning and end of each string
            results_arr = [s.strip() for s in results_arr]
            # Remove empty strings and comments that start with '#'
            results_arr = [s for s in results_arr if s and not s.startswith('#')]

        return str_imp.join(results_arr)
    
    @staticmethod
    def _encode(
        arr: Union[dict, list, tuple, set],
        results_arr: list,
        level: int = 0,
        lvl_ch: str = ":",
        spc_ch: str = " ",
        is_list: int = 0
    ) -> None:

        # select value-encoder function: custom or internal default
        value_enco_fun = HELML.CUSTOM_VALUE_ENCODER if HELML.CUSTOM_VALUE_ENCODER is not None else HELML.valueEncoder

        # convert arr to dict if need
        if not isinstance(arr, dict):
            arr = {index: value for index, value in enumerate(arr)}

        for key, value in arr.items():
            if not isinstance(key, str):
                key = str(key)

            if is_list and HELML.ENABLE_BONES and spc_ch == " ":
                key = '--'
            elif not is_list:
                # encode key to base64url if contains unwanted characters
                # check first char
                fc = key[:1]
                # encode key in base64url if it contains unwanted characters
                if lvl_ch in key or fc == "#" or fc == spc_ch or fc == ' ' or fc == ''  or key[-1] == spc_ch or key[-1] == ' ':
                    fc = '-'
                elif level == 0 and fc == '/' and key.startswith('//'): # prevent '//' at begin of the line
                    fc = '-'
                elif not (re.match(r'^[ -}]+$', key) if spc_ch == '_' else re.match(r'^[^\x00-\x1F\x7E-\xFF]+$', key)):
                    fc = '-'
                if fc == '-':
                    # add "-" to the beginning of the key to indicate it's in base64url
                    key = '-' + HELML.base64Uencode(key)

            # add the appropriate number of colons to the left of the key, based on the current level
            ident = lvl_ch * level

             # add space-ident to the left of the key (if need)
            if HELML.ENABLE_SPC_IDENT and spc_ch == ' ':
                ident = spc_ch * (level * HELML.ENABLE_SPC_IDENT) + ident

            is_numkeys = isinstance(value, (list, tuple, set))

            if is_numkeys or isinstance(value, dict):
                # Add empty line before create-key
                if HELML.ENABLE_KEY_UPLINES and spc_ch == ' ':
                    results_arr.append('')

                # add ":" after key for lists
                if not is_numkeys:
                    key += lvl_ch

                results_arr.append(ident + key)

                HELML._encode(value, results_arr, level + 1, lvl_ch, spc_ch, is_numkeys)

                if HELML.ENABLE_KEY_UPLINES and spc_ch == ' ':
                    results_arr.append(spc_ch * level + '#')
            else:
                # use selected value encoder function
                value = value_enco_fun(value, spc_ch)

                # add the key:value pair to the output
                results_arr.append(ident + key + lvl_ch + value)

    @staticmethod
    def decode(
        src_rows: str,
        get_layers: Union[int, str, Set[Union[str, int]], List[Union[str, int]]] = [0]
    ) -> Dict:

        # Modify get_layers if needed: convert single T to array [0, T]
        if isinstance(get_layers, (int, str)):
            get_layers = ['0', get_layers]
        # Prepare layers_set from get_layers (str)
        layers_set = set()
        for i in get_layers:
            if not isinstance(i, str):
                i = str(i)
            layers_set.add(i)

        lvl_ch: str = ":"
        spc_ch: str = " "

        # Search postfix
        postfixIndex = src_rows.find('~#'); #postfix "~#: ~"
        if postfixIndex >= 0 and src_rows[postfixIndex+4] == '~':
            # get control-chars from postfix
            lvl_ch = src_rows[postfixIndex+2]
            spc_ch = src_rows[postfixIndex+3]

            # skip prefix
            stpos = 0
            for ch in src_rows:
                if ch != ' ' and ch != "\t" and ch != '~':
                    break
                stpos += 1

            # cut string between prefix and postfix
            src_rows = src_rows[stpos:postfixIndex]

        # Explode src_rows to lines
        for exploder_ch in ["\r\n", "\r", "\n"]:
            if exploder_ch in src_rows:
                break
        
        # Replace all ~ to line divider
        src_rows = src_rows.replace("~", "\n")

        # Explode string to lines
        str_arr = src_rows.split(exploder_ch)

        return HELML._decode(str_arr, layers_set, lvl_ch, spc_ch)

    def _decode(
        str_arr: list,
        layers_set: set,
        lvl_ch: str,
        spc_ch: str
    ) -> Dict:
        # select value decoder function custom or internal default
        value_deco_fun = HELML.CUSTOM_VALUE_DECODER if HELML.CUSTOM_VALUE_DECODER is not None else HELML.valueDecoder
        
        # layer values prepare
        layer_init: str = '0'
        layer_curr:str = layer_init
        all_layers = set(['0'])

        # Initialize result array and stack for keeping track of current array nesting
        result = {}
        stack = []

        # array of stack stamps for delayed conversion dict to list
        tolist = []

        min_level: int = -1

        # Loop through each line in the input array
        for line in str_arr:
            line = line.strip()

            # Skip empty lines and comment lines starting with '#'
            if not len(line) or line[0] == "#" or line.startswith('//'):
                continue

            # Calculate the level of nesting for the current line by counting the number of colons at the beginning
            level = 0
            while line[level] == lvl_ch:
                level += 1

            # If the line has colons at the beginning, remove them from the line
            if level:
                line = line[level:]

            # Split the line into a key and a value (or null if the line starts a new array)
            parts = line.split(lvl_ch, 1)
        
            key = parts[0] if parts[0].strip() else ""
            value = parts[1] if len(parts) > 1 else None

            if len(key) == 0:
                continue

            # check min_level
            if min_level < 0 or min_level > level:
                min_level = level

            extra_keys_cnt: int = len(stack) - (level - min_level)
            if extra_keys_cnt > 0:
                layer_curr = layer_init
                while len(stack) and extra_keys_cnt > 0:
                    stack.pop()
                    extra_keys_cnt -= 1

            # Find the parent element in the result dictionary for the current key
            parent = result
            for parent_key in stack:
                parent = parent[parent_key]

            # Decode the key if it starts with an equals sign
            if key.startswith("-"):
                # Next number keys
                if key == '--':
                    # Next Num keys
                    key = (str)(len(parent))

                # Layer control keys
                elif key == '-+' or key == '-++' or key == '---':
                    if not value is None:
                        value = value.strip()
                    if key == '-++':
                        layer_init = value if value else '0'
                        layer_curr = layer_init
                    elif key == '-+':
                        if value is None:
                            layer_curr = str(int(layer_curr) + 1) if layer_curr.isdigit() else layer_init
                        else:
                            layer_curr = layer_init if value == '' else value

                    all_layers.add(layer_curr)
                    continue
                else:
                    decoded_key = HELML.base64Udecode(key[1:])
                    if decoded_key != None:
                        key = decoded_key

            # If the value is null, start a new dictionary and add it to the parent dictionary
            if value is None or value == '':
                layer_curr = layer_init
                parent[key] = {}
                stack.append(key)
                if value is None:
                    tolist.append(stack.copy())
            elif layer_curr in layers_set:
                # Decode the value by selected value-decoder-function
                # Add the key-value pair to the current dictionary
                parent[key] = value_deco_fun(value, spc_ch)

        # try convert nested arrays by keys-pathes from tolist
        for stack in tolist:
            parent = result
            for parent_key in stack[:-1]:
                parent = parent[parent_key]

            last_key = stack[-1]
            if isinstance(parent, list) and HELML.is_numeric(last_key) and int(last_key) < len(parent):
                last_key = int(last_key)
            if ((isinstance(parent, dict) and parent.get(last_key) is not None) or isinstance(last_key, int)) and isinstance(parent[last_key], dict):
                # convert from dict to list if possible
                converted = []
                keys = parent[last_key].keys()
                for i in range(len(keys)):
                    if str(i) not in keys or parent[last_key][str(i)] is None:
                        # Key not found
                        break
                    converted.append(parent[last_key][str(i)])
                else:
                    # overwrite the key only if the conversion was successful
                    parent[last_key] = converted
                

        if (len(all_layers) > 1):
            result['_layers'] = all_layers

        # Return the result dictionary
        return result

    @staticmethod
    def valueEncoder(
        value: Union[str, int, float, bool, None],
        spc_ch: str = " "
    ) -> str:
        """
        Encodes a value into a HELML string.

        Args:
            value: The value to be encoded.
            spc_ch: The space character used for encoding.

        Returns:
            str: The encoded HELML string.
        """

        value_type = type(value).__name__
        if value_type == "str":
            if not value or not (re.match(r'^[ -}]+$', value) if spc_ch == '_' else re.match(r'^[^\x00-\x1F\x7E-\xFF]+$', value)):
                # if the string contains special characters, encode it in base64
                return '-' + HELML.base64Uencode(value)
            elif value[0] == spc_ch or value[-1] == spc_ch or value[-1] == ' ':
                # for empty strings or those that have spaces at the beginning or end
                return "'" + value + "'"

            # if the value is simple, just add one space at the beginning
            return spc_ch + value

        elif value_type == "int":
            return spc_ch * 2 + str(value)

        elif value_type == "bool":
            value = "T" if value else "F"

        elif value_type == "NoneType":
            value = "N"

        elif value_type == "float":

            value = str(value)
            if value == 'nan':
                value = 'NAN'
            elif value == 'inf':
                value = 'INF'
            elif value == '-inf':
                value = 'NIF'
            elif spc_ch == "_": # for url-mode because float contain dot-inside
                return '-' + HELML.base64Uencode(value)

        return spc_ch * 2 + str(value)


    @staticmethod
    def valueDecoder(encodedValue: str, spc_ch: str = ' ') -> Union[str, int, float, bool, None]:
        """
        Decodes a HELML formatted string into its original value.

        Args:
            encoded_value (str): The HELML encoded value as a string.
            spc_ch (str, optional): The space character used for decoding. Defaults to ' '.

        Returns:
            Union[str, int, float, bool, None]: The decoded value, which can be of type str, int, float, bool, or None.
        """

        # calc stpos by first-2-chars of encodedValue
        #stpos = 2 if encodedValue.startswith(spc_ch*2) else 1 if encodedValue.startswith(spc_ch) else 0
        stpos = 0
        while encodedValue.startswith(spc_ch, stpos):
            stpos += 1

        # raw
        if stpos == 1:
            return encodedValue[1:]

        # special 0
        if stpos == 0:
            fc = encodedValue[0]

            if fc == '-':
                return HELML.base64Udecode(encodedValue[1:])
            elif fc == "'":
                return encodedValue[1:-1]
            elif fc == '"':
                return encodedValue[1:-1].encode('utf-8').decode('unicode_escape')
            elif fc == '%':
                return HELML.hexDecode(encodedValue[1:])

        sliced_value = encodedValue[stpos:]

        # stpos != 1
        if stpos > 1:
            # content-dependent decoding
            if sliced_value in HELML.SPEC_TYPE_VALUES:
                return HELML.SPEC_TYPE_VALUES[sliced_value]

            elif HELML.is_numeric(sliced_value):
                # it's probably a numeric value
                if '.' in sliced_value:
                    # if there's a decimal point, it's a floating point number
                    return float(sliced_value)
                else:
                    # if there's no decimal point, it's an integer
                    return int(sliced_value, 10)

        # if there are no spaces or quotes or "-" at the beginning
        if HELML.CUSTOM_FORMAT_DECODER is not None:
            # use custom-decoder if defined
            return HELML.CUSTOM_FORMAT_DECODER(encodedValue, spc_ch)

        # fallback: return "as is"
        return encodedValue

    @staticmethod
    def base64Uencode(string: str) -> str:
         enc = base64.b64encode(string.encode())
         return enc.decode().rstrip("=").translate(str.maketrans('+/', '-_'))

    @staticmethod
    def base64Udecode(s: str) -> str:
        l = len(s)
        if not l:
            return ""
        l %= 4
        if l:
            s += "=" * (4 - l)
        try:
            decoded = base64.b64decode(s.translate(str.maketrans('-_', '+/')).encode()).decode()
            return decoded
        except Exception:
            return None
        
    @staticmethod
    def hexDecode(encoded: str) -> Union[str, None]:
        hexc1 = '0123456789abcdefABCDEF'
        hexc2 = hexc1 + ' '
        decoded = ''
        i = 0
        while i < len(encoded):
            fc = encoded[i]
            sc = encoded[i+1] if i+1 < len(encoded) else None
            if fc in hexc1 and sc in hexc2:
                decoded += chr(int(fc + sc, 16))
                i += 2
            else:
                return None
        return decoded

    @staticmethod
    def is_numeric(value: str) -> bool:
        try:
            float(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def num_keys_cnt(arr: Union[dict, list, tuple, set]) -> int:
        el_count = len(arr)
        if not el_count:
            return 0
        if not isinstance(arr, dict):
            return el_count
        
        # check for non-empty dict only, get keys list
        keys_list = arr.keys()
        exp_keys_range = range(0, el_count)
        for i in keys_list:
            if not isinstance(i, (int, str)):
                return 0
            try:
                if int(i) not in exp_keys_range:
                    return 0
            except ValueError:
                return 0

        return el_count