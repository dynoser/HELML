import unittest

import random
import string
from typing import Any, Dict, List, Union
from HELML import HELML

def random_string_ascii(length: int) -> str:
    characters = string.ascii_letters + string.digits + string.punctuation + " "
    return ''.join(random.choices(characters, k=length))

def random_string_utf(length: int) -> str:
    characters = string.ascii_letters + string.digits + string.punctuation + " "
    characters += ''.join([chr(i) for i in range(0x4E00, 0x9FBF)]) # добавляем китайские символы
    characters += ''.join([chr(i) for i in range(0x0400, 0x04FF)]) # добавляем русские символы
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

class TestHELML(unittest.TestCase):
    def test_encode_decode(self):
        for _ in range(100):  # количество случайных тестов
            original_data = generate_nested_dict()
            encoded_data = HELML.encode(original_data, True)
            decoded_data = HELML.decode(encoded_data)
            assert decoded_data == original_data, f"Ошибка: исходные данные {original_data}, после кодирования и декодирования {decoded_data}"

