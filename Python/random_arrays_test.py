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
        expected_url = "A.~.0.__0~.1.__1~.2.~..0._In0~..1.__888~.3._Four~.4.''~B._B-key~C._C-key~D._D-key~TR.__T~FL.__F~NO.__N"
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


if __name__ == '__main__':
    t = TestHELML()
    t.test_encode_decode_url_mode()
    t.test_utf8_codes()
    t.test_custom_decoder()
    t.test_main_types()
    t.test_special_types()
    t.test_nan_type()
    t.test_rows_decode()
