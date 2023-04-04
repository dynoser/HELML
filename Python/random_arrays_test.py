import unittest
import subprocess
import math

import time
import datetime
import random
import string
from typing import Any, Dict, List, Union
from HELML import HELML

def random_string_ascii(length: int) -> str:
    characters = string.ascii_letters + string.digits + string.punctuation + " "
    return ''.join(random.choices(characters, k=length))

def random_string_utf(length: int) -> str:
    characters = string.ascii_letters + string.digits + string.punctuation + " "
    characters += ''.join([chr(i) for i in range(0x4E00, 0x9FBF)]) # add chinese
    characters += ''.join([chr(i) for i in range(0x0400, 0x04FF)]) # add russian
    return ''.join(random.choices(characters, k=length))

def random_string(length: int) -> str:
    if not length:
        return ''
    
    # simple mode
    #return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

    # advanced mode
    if random.randint(0,100) > 80:
        return random_string_utf(length)
    else:
        return random_string_ascii(length)

def random_value() -> Union[int, float, str, bool]:
    random_type = random.choice(["int", "str", "bool"]) # "float"
    if random_type == "int":
        return random.randint(-1000, 1000)
    elif random_type == "float":
        return round(random.uniform(-1000, 1000), 2)
    elif random_type == "bool":
        return random.randint(0,100) > 50
    else:
        return random_string(random.randint(0, 10))

def generate_nested_dict(depth: int = 3, size: int = 5) -> Dict[str, Any]:
    if depth == 0:
        return {random_string(random.randint(1, 10)): random_value() for _ in range(size)}
    else:
        return {random_string(random.randint(3, 5)): (generate_nested_dict(depth - 1, size) if random.random() < 0.5 else random_value()) for _ in range(size)}

def custom_decoder_function(value: str, spc_ch: str) -> str:
    if value.startswith("  T"):
        try:
            timestamp = float(value[3:])
            dt = datetime.datetime.fromtimestamp(timestamp)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass
    
    return value

class TestHELML(unittest.TestCase):
    def test_encode_decode_url_mode(self):
        for _ in range(50):
            original_data = generate_nested_dict()
            encoded_data = HELML.encode(original_data, True)
            decoded_data = HELML.decode(encoded_data)
            assert decoded_data == original_data, f"Error: source data {original_data}, after encode-decode {decoded_data}"

    def test_encode_decode_lines_mode(self):
        for _ in range(50):
            original_data = generate_nested_dict()
            encoded_data = HELML.encode(original_data, False)
            decoded_data = HELML.decode(encoded_data)
            assert decoded_data == original_data, f"Error: source data {original_data}, after encode-decode {decoded_data}"

    def test_console_php_subprocess(self):
        for _ in range(100):
            original_data = generate_nested_dict()
            encoded_data = HELML.encode(original_data, True)
            result = subprocess.run(['php', 'PHP/console_test.php', encoded_data], stdout=subprocess.PIPE)
            encoded_data = result.stdout.decode('utf-8').strip()
            decoded_data = HELML.decode(encoded_data)
            assert decoded_data == original_data, f"Error: source data {original_data}, after encode-decode {decoded_data}"

    def test_rows_decode(self):
        with open('test_req_rows.txt', 'r') as f:
            lines = f.readlines()

        start_time = time.time()

        for line in lines:
            enco_line = line.strip()
            arr = HELML.decode(enco_line)
            self.assertIsInstance(arr, dict)

            # encode to url-mode and decode back
            row = HELML.encode(arr, True)
            a2 = HELML.decode(row)
            assert a2 == arr, "Different decode results"


        end_time = time.time()

        print("Execution time: ", end_time - start_time, " seconds, total: ", len(lines), "rows")

    def test_dict_num_keys(self):
        arr = [
            [2, (22, '333')],
            [6, [22, '333',4444, '555555',66666, True]],
            [0, {"0": 11, None: 222, "2": "3333", '3': '44444'}],
            [5, {0: 11, 1: 222, 2: "3333",  3: '44444', 4: False}],
            [6, {0: 11, 1: 222, 2: "3333", '3': '44444', '4': True, '5': None}],
            [0, {0: 11, 1: 222, 2: "3333",  5: '44444'}],
            [0, {0: 11, 1: 222, 2: "3333", '5': '44444'}],
            [4, {"0": 11, "1": 222, "2": "3333", '3': '44444'}],
            [0, {}],
            [3, {"2": "Two", 1: "one", "0": "Zero"}],
            [0, {"0": 11, "A": 222, "2": "3333", '3': '44444'}],
        ]
        for expected_result, input_dict in arr:
            self.assertEqual(HELML.num_keys_cnt(input_dict), expected_result)

    def test_in_array_types(self):
        # Union[dict, list, tuple, set]
        arr: dict = {}
        exp_dict = {'0': 11, '1': 222, '2': "3333", '3': '44444'}
        exp_values = exp_dict.values()
        arr['dict'] = {0: 11, 1: 222, 2: "3333", 3: '44444'}
        arr['tuple']  =  (11,    222,    "3333",    '44444')
        arr['list']   =  [11,    222,    "3333",    '44444']
        arr['set'] = set([11,    222,    "3333",    '44444'])

        enco_target = '--:  11\n--:  222\n--: 3333\n--: 44444'

        for arr_type, arr_data in arr.items():
            encoded_str = HELML.encode(arr_data)
            deco_arr = HELML.decode(encoded_str)
            if (arr_type == 'set'):
                for k, v in deco_arr.items():
                    assert v in exp_values, f"Error: type {arr_type} broken"
            else:
                assert exp_dict == deco_arr, f"Error: type {arr_type} broken"




    def test_main_types(self):
        h_ml = """

        # Nested structure
        A:
        :0:  0
        :1:  1
        :2:
        ::0: In0
        ::1:  888
        :3: Four
        
        # Empty string
        :4:""

        # Key in base64
        -Qg=: B-key

        # Value in base64
        C:-Qy1rZXk=

        # Key and Value base64-encoded 
        -RA:-RC1rZXk

        # Boolean
        TR:  T
        FL:  F

        # Nules
        NO:  N

        """
        decoded_data = HELML.decode(h_ml)
        expected_data = {'A': [0, 1, ['In0', 888], 'Four', ''], 'B': 'B-key', 'C': 'C-key', 'D': 'D-key', 'TR': True, 'FL': False, 'NO': None}

        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"

        encoded_data = HELML.encode(decoded_data, True)
        expected_url = "A.~.0.__0~.1.__1~.2.~..0._In0~..1.__888~.3._Four~.4.-~B._B-key~C._C-key~D._D-key~TR.__T~FL.__F~NO.__N"
        assert encoded_data == expected_url, f"Error: URL-encoded data {encoded_data}, expected data {expected_url}"

        decoded_data = HELML.decode(encoded_data)
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"
    
    def test_utf8_codes(self):
        h_ml = '''
        塕煘錇趁塿絩瀬: 塕煘錇趁塿絩瀬
        фыва: пролджэ
        '''
        first_dec = HELML.decode(h_ml)
        encoded_data = HELML.encode(first_dec, False)
        second_dec = HELML.decode(encoded_data)
        assert first_dec == second_dec, f"Error: first_dec {first_dec}, second_dec {second_dec}"


        encoded_data = HELML.encode(first_dec, True)
        second_dec = HELML.decode(encoded_data)
        assert first_dec == second_dec, f"Error URL in mode: first_dec {first_dec}, second_dec {second_dec}"

    def test_b64_on_keys(self):
        arr = {
            "": "Empty key",
            "\n": "Empty line",
            "\t": "Tab",
            "\n\n\n": "Empty lines",
            "\t\t\t": "Tabs",
            "One\nTwo": "Empty line inside",
            "One\tTwo": "Tabs",
            "Tilda~Inside": "~",
            " Space left": "SPC LEFT",
            "Space right ": "SPC RIGHT",
            " Spaces ": "SPC LEFT AND RIGHT",
            " Spaces ": "SPC LEFT AND RIGHT",
            "Норм ключ": " Значение",
            "Ключ с : двоеточием": "",
            ":": "Просто ключ-двоеточие",
            "0": "Zero-key"
        }
        encoded_data = HELML.encode(arr, False)
        expected_enc = """\
-: Empty key
-Cg: Empty line
-CQ: Tab
-CgoK: Empty lines
-CQkJ: Tabs
-T25lClR3bw: Empty line inside
-T25lCVR3bw: Tabs
-VGlsZGF-SW5zaWRl:-fg
-IFNwYWNlIGxlZnQ: SPC LEFT
-U3BhY2UgcmlnaHQg: SPC RIGHT
-IFNwYWNlcyA: SPC LEFT AND RIGHT
Норм ключ:' Значение'
-0JrQu9GO0Ycg0YEgOiDQtNCy0L7QtdGC0L7Rh9C40LXQvA:-
-Og: Просто ключ-двоеточие
0: Zero-key"""
        decoded_data = HELML.decode(encoded_data)
        assert decoded_data == arr, f"Error, different data on keys encode test"
        assert encoded_data == expected_enc, "Error, unexpected encoded data keys-encode test"

    def test_b64_on_values(self):
        arr = [
            "Simple value",
            "\n",
            "\t",
            "\n\n\n",
            "\t\t\t",
            "Empty line\ninside",
            "Tab\tInside",
            "Tilda~Inside",
            " Space left",
            "Space right ",
            " Spaces both ",
            "Норм Значение",
            "Значение с : двоеточием",
            ":",
            "0",
            "",
            "-Минус в начале",
            "-"
        ]
        encoded_data = HELML.encode(arr, False)
        print(encoded_data)
        expected_enc = """\
--: Simple value
--:-Cg
--:-CQ
--:-CgoK
--:-CQkJ
--:-RW1wdHkgbGluZQppbnNpZGU
--:-VGFiCUluc2lkZQ
--:-VGlsZGF-SW5zaWRl
--:' Space left'
--:'Space right '
--:' Spaces both '
--: Норм Значение
--: Значение с : двоеточием
--: :
--: 0
--:-
--: -Минус в начале
--: -"""
        decoded_data = HELML.decode(encoded_data)
        arr_obj = {str(idx): val for idx, val in enumerate(arr)}
        assert decoded_data == arr_obj, f"Error, different data on values encode test"
        assert encoded_data == expected_enc, "Error, unexpected encoded data values-encode test"

    def test_min_level(self):
        '''This test allows us to check that we can add extra colons on the left.'''

        h_ml = """
            ::A:  T
            ::B:  F
            ::C:
            :::--:  T
            :::--:  F
            ::D:  N
            """
        decoded_data = HELML.decode(h_ml)
        expected_data = {
            "A": True,
            "B": False,
            "C": [ True, False ],
            "D": None
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"


    def test_nan_type(self):
        h_ml = 'A:  NAN'
        decoded_data = HELML.decode(h_ml)
        expected_data = {'A': float('nan')}
        # cannot be compared by 'assert' because NaN is not equal to itself
        # assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"
        assert math.isnan(decoded_data['A']), f"Error: decoded data not is NaN"

    def test_special_types(self):
        h_ml = """
            A:  INF
            B:  NIF
            C:  N
            D:  T
            F:  F
            """
        decoded_data = HELML.decode(h_ml)
        expected_data = {
            "A": float("inf"),
            "B": float("-inf"),
            "C": None,
            "D": True,
            "F": False
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"


    def test_custom_decoder(self):
        HELML.CUSTOM_FORMAT_DECODER = custom_decoder_function
        h_ml = 'A:  T1635600000'
        decoded_data = HELML.decode(h_ml)
        expected_data = {"A": "2021-10-30 16:20:00"}
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"

    def test_layer_next(self):
        h_ml = """
            A:  T
            B:  F
            C:  N
            D: Americano with milk
            -+
            D: Руссиано с молоком
            -+
            D: Deutschiano mit Milch
            -+:
            F:  F
            """
        decoded_data = HELML.decode(h_ml)
        expected_data = {
            "A": True,
            "B": False,
            "C": None,
            "D": "Americano with milk",
            "F": False,
            '_layers': set(['0', '1', '2'])
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"

        decoded_data = HELML.decode(h_ml, 1)
        expected_data = {
            "A": True,
            "B": False,
            "C": None,
            "D": "Руссиано с молоком",
            "F": False,
            '_layers': set(['0', '1', '2'])
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"

        decoded_data = HELML.decode(h_ml, [0, 2])
        expected_data = {
            "A": True,
            "B": False,
            "C": None,
            "D": "Deutschiano mit Milch",
            "F": False,
            '_layers': set(['0', '1', '2'])
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"

    def test_layer_init(self):
        h_ml = """
            A:  T
            B:  F
            C:  N
            D: Americano with milk
            -++: ru
            D: Руссиано с молоком
            Sub:
            :--:  1
            :--:  2
            -+: de
            D: Deutschiano mit Milch
            -++
            F:  F
            """
        decoded_data = HELML.decode(h_ml)
        expected_data = {
            "A": True,
            "B": False,
            "C": None,
            "D": "Americano with milk",
            "Sub": [],
            "F": False,
            '_layers': set(['0', 'ru', 'de'])
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"
        decoded_data = HELML.decode(h_ml, 'ru')
        expected_data = {
            "A": True,
            "B": False,
            "C": None,
            "D": "Руссиано с молоком",
            "Sub": [1, 2],
            "F": False,
            '_layers': set(['0', 'ru', 'de'])
        }
        assert decoded_data == expected_data, f"Error: decoded data {decoded_data}, expected data {expected_data}"



if __name__ == '__main__':
    t = TestHELML()
    t.test_b64_on_values()
    t.test_b64_on_keys()
    t.test_utf8_codes()
    t.test_main_types()
    t.test_dict_num_keys()
    t.test_in_array_types()
    t.test_layer_next()
    t.test_encode_decode_url_mode()
    t.test_custom_decoder()
    t.test_special_types()
    t.test_nan_type()
    t.test_rows_decode()
