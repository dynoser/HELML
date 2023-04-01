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
    
    ENABLE_SPC_IDENT = True # For encode: add space-indentation at begin of string
    ENABLE_KEY_UPLINES = True # For encode: add empty line before create-array-keys

    @staticmethod
    def encode(
        arr: Union[list, dict, tuple, set],
        url_mode: bool = False
    ) -> str:
        """
        Encode array to HELML string.
        
        :param arr: Input data structure (list, dict, or tuple) to be encoded.
        :param url_mode: A boolean indicating if the URL mode should be used.
        :param val_encoder: A function to encode values or True for default encoding.
        :return: Encoded HELML string.
        """
        results_arr = []

        str_imp = "~" if url_mode else "\n"
        lvl_ch = "." if url_mode else ":"
        spc_ch = "_" if url_mode else " "

        HELML._encode(arr, results_arr, 0, lvl_ch, spc_ch)

        if url_mode and len(results_arr) == 1:
            results_arr.append('')

        return str_imp.join(results_arr)
    
    @staticmethod
    def _encode(
        arr: Union[dict, list, tuple, set],
        results_arr: list,
        level: int = 0,
        lvl_ch: str = ":",
        spc_ch: str = " "
    ) -> None:
        """
        Encode arr to results_arr (by reference).
        
        :param arr: Input data structure (dict, list, or tuple) to be encoded.
        :param results_arr: A list of strings representing the encoded data.
        :param val_encoder: A function to encode values or True for default encoding.
        :param level: The current level of nesting.
        :param lvl_ch: Character used for level separation.
        :param spc_ch: Character used for space.
        """

        # select value-encoder function: custom or internal default
        value_enco_fun = HELML.CUSTOM_VALUE_ENCODER if HELML.CUSTOM_VALUE_ENCODER is not None else HELML.valueEncoder

        # convert arr to dict if need
        if not isinstance(arr, dict):
            arr = {index: value for index, value in enumerate(arr)}

        for key, value in arr.items():
            if not isinstance(key, str):
                key = str(key)

            # check first char
            first_char = key[:1]
            # encode key in base64url if it contains unwanted characters
            if lvl_ch in key or "~" in key or first_char == "#" or first_char == spc_ch or first_char == ' ' or first_char == '':
                need_encode = True
            else:
                if spc_ch == '_':
                    need_encode = not re.match(r"^[ -~]*$", key, flags=re.UNICODE)
                else:
                    need_encode = not all(c.isprintable() for c in key)

            if need_encode or first_char == "-" or key[-1] == spc_ch or key[-1] == ' ':
                # add "-" to the beginning of the key to indicate it's in base64url
                key = "-" + HELML.base64url_encode(key)

            # add the appropriate number of colons to the left of the key, based on the current level
            ident = lvl_ch * level

             # add space-ident to the left of the key (if need)
            if HELML.ENABLE_SPC_IDENT and spc_ch == ' ':
                ident = spc_ch * level + ident

            if isinstance(value, (list, dict, tuple)):
                # Add empty line before create-key
                if HELML.ENABLE_KEY_UPLINES and spc_ch == ' ':
                    results_arr.append('')
                
                # if the value is a dictionary, call this function recursively and increase the level
                if isinstance(value, (list, tuple)):
                    key += lvl_ch

                results_arr.append(ident + key)
                HELML._encode(value, results_arr, level + 1, lvl_ch, spc_ch)

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
        """
        Decodes a HELML formatted string or list of strings into a nested dictionary.

        Args:
            src_rows: The HELML input as a string or strings-array.
            val_decoder: The custom value decoder function. For default encoder set True.

        Returns:
            Dict: The decoded nested dictionary.
        """

        # select value decoder function custom or internal default
        value_deco_fun = HELML.CUSTOM_VALUE_DECODER if HELML.CUSTOM_VALUE_DECODER is not None else HELML.valueDecoder

        lvl_ch: str = ":"
        spc_ch: str = " "
        layer_init: str = '0'
        layer_curr:str = layer_init
        all_layers = set([layer_init])

        # Prepare layers_set from get_layers
        # 1. Modify get_layers if needed: convert single T to array [0, T]
        if isinstance(get_layers, (int, str)):
            get_layers = [layer_init, get_layers]
        # 2. Create layers_set and set all values from get_layers (str)
        layers_set = set()
        for i in get_layers:
            if not isinstance(i, str):
                i = str(i)
            layers_set.add(i)


        # Explode src_rows to lines
        for exploder_ch in ["\n", "\r", "~"]:
            if exploder_ch in src_rows:
                if "~" == exploder_ch:
                    lvl_ch = "."
                    spc_ch = "_"
                break

        str_arr = src_rows.split(exploder_ch)

        # Initialize result array and stack for keeping track of current array nesting
        result = {}
        stack = []

        # array of stack stamps for delayed conversion of dict to list
        tolist = []

        min_level: int = -1

        # Loop through each line in the input array
        for line in str_arr:
            line = line.strip()

            # Skip empty lines and comment lines starting with '#'
            if not len(line) or line[0] == "#":
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
        
            key = parts[0] if parts[0] else 0
            value = parts[1] if len(parts) > 1 else None

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

                if key.startswith('-+'):
                    # Layer control keys
                    if value != None:
                        value = value.strip()
                    if key == '-++':
                        layer_init = value if value else '0'
                        layer_curr = layer_init
                    elif key == '-+':
                        if value == None:
                            layer_curr = str(int(layer_curr) + 1) if layer_curr.isdigit() else layer_init
                        else:
                            layer_curr = layer_init if value == '' else value

                    all_layers.add(layer_curr)
                    continue
                elif key == '--' or key == '---':
                    # Next Num keys
                    key = (str)(len(parent))
                else:
                    key = HELML.base64url_decode(key[1:])
                    if key == None:
                        key = "ERR"

            # If the value is null, start a new dictionary and add it to the parent dictionary
            if value is None or value == '':
                layer_curr = layer_init
                parent[key] = {}
                stack.append(key)
                if value == '':
                    tolist.append(stack.copy())
            elif layer_curr in layers_set:
                # Decode the value by selected value-decoder-function
                value = value_deco_fun(value, spc_ch)
                # Add the key-value pair to the current dictionary
                parent[key] = value

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
            spc_ch: The space character used for encoding. Default " ".

        Returns:
            str: The encoded HELML string.
        """

        value_type = type(value).__name__
        if value_type == "str":
            if spc_ch == "_": # for url-mode
                need_encode = "~" in value
                if not need_encode:
                    need_encode = not re.match(r"^[ -~]*$", value, flags=re.UNICODE)
            else:
                need_encode = not all(c.isprintable() for c in value)
                # reg_str = r"^[\p{Print}]*$"

            if need_encode:
                # if the string contains special characters, encode it in base64
                return '-' + HELML.base64url_encode(value)
            elif not value or value[0] == spc_ch or value[-1] == spc_ch or value[-1] == ' ':
                # for empty strings or those that have spaces at the beginning or end
                return "'" + value + "'"
            else:
                # if the value is simple, just add one space at the beginning
                return spc_ch + value
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
                return HELML.base64url_encode(value)

        return spc_ch * 2 + str(value)


    @staticmethod
    def valueDecoder(encoded_value: str, spc_ch: str = ' ') -> Union[str, int, float, bool, None]:
        """
        Decodes a HELML formatted string into its original value.

        Args:
            encoded_value (str): The HELML encoded value as a string.
            spc_ch (str, optional): The space character used for decoding. Defaults to ' '.

        Returns:
            Union[str, int, float, bool, None]: The decoded value, which can be of type str, int, float, bool, or None.
        """

        first_char = '' if not len(encoded_value) else encoded_value[0]

        if spc_ch == first_char:
            if encoded_value[:2] != spc_ch * 2:
                # if the string starts with only one space, return the string after it
                return encoded_value[1:]
            # if the string starts with two spaces, then it encodes a non-string value
            sliced_value = encoded_value[2:]  # strip left spaces
            if sliced_value in HELML.SPEC_TYPE_VALUES:
                return HELML.SPEC_TYPE_VALUES[sliced_value]

            if HELML.is_numeric(sliced_value):
                # it's probably a numeric value
                if '.' in sliced_value:
                    # if there's a decimal point, it's a floating point number
                    return float(sliced_value)
                else:
                    # if there's no decimal point, it's an integer
                    return int(sliced_value)

            if HELML.CUSTOM_FORMAT_DECODER is not None:
                encoded_value = HELML.CUSTOM_FORMAT_DECODER(encoded_value, spc_ch)

            return encoded_value
        elif first_char == '"' or first_char == "'":  # it's likely that the string is enclosed in single or double quotes
            encoded_value = encoded_value[1:-1] # trim the presumed quotes at the edges and return the interior
            if first_char == "'":
                return encoded_value
            try:
                return encoded_value.encode('utf-8').decode('unicode_escape')
            except ValueError:
                return False
        elif first_char == '-':
            return HELML.base64url_decode(encoded_value[1:])

        # if there are no spaces or quotes or "-" at the beginning
        if HELML.CUSTOM_FORMAT_DECODER is not None:
            # use custom-decoder if defined
            return HELML.CUSTOM_FORMAT_DECODER(encoded_value, spc_ch)

        # fallback: will return decoded string or None
        return HELML.base64url_decode(encoded_value)

    @staticmethod
    def base64url_encode(string: str) -> str:
         enc = base64.b64encode(string.encode())
         return enc.decode().rstrip("=").translate(str.maketrans('+/', '-_'))

    @staticmethod
    def base64url_decode(s: str) -> str:
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
    def is_numeric(value: str) -> bool:
        try:
            float(value)
            return True
        except ValueError:
            return False