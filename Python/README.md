# HELML

## Overview
HELML (Human-Editable List Markup Language , HEader-Like Markup Language) is a Python library that provides an easy way to encode and decode data structures such as lists, dictionaries, and tuples into human-readable and editable strings. This can be used for cross-platform data transfer, configuration files, data serialization, and other purposes.

See more: [HELML format definition](https://github.com/dynoser/HELML/blob/master/README-HELML_en.md)


# Installation
To install HELML, simply use pip:

```bash
pip install helml
```

# Usage

Here's a quick example of how to use the HELML library:

```python
from helml import HELML

# Example data structure
data = {
    "key1": "value1",
    "key2": [1, 2, 3],
    "key3": {
        "nested_key": "nested_value"
    }
}

# Encode the data structure into a HELML string
encoded_data = HELML.encode(data)
print(encoded_data)
# Decode the HELML string back into a data structure
decoded_data = HELML.decode(encoded_data)
print(decoded_data)
```
encoded_data:
```console
key1: value1
key2:
:0:  1
:1:  2
:2:  3
key3
:nested_key: nested_value
```


# Features
Encode and decode lists, dictionaries, and tuples into human-readable and editable strings.
Support for URL mode, which uses different characters to separate levels and spaces.
Customizable value encoding and decoding functions.
Easy-to-understand format that can be used for various applications.

# API

### **HELML.encode**(arr, url_mode=False)

Encode a data structure (list, dict, or tuple) into a HELML string.

- **arr**: The input data structure to be encoded.
- **url_mode** (bool, optional): A boolean indicating if the URL mode should be used. Defaults to False.

Returns:

- str: The encoded HELML string.

### **HELML.decode**(src_rows)

Decode a HELML formatted string or list of strings into a nested dictionary.

- **src_rows**: The HELML input as a string or strings-array.

Returns:

- dict: The decoded nested dictionary.


# License
This project is licensed under the MIT License.
