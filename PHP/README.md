# HELML

![helml-logo](https://github.com/dynoser/HELML/raw/master/logo/icon.png)

## PHP package

* [PHP Source code -- phpHELML](https://github.com/dynoser/phpHELML)
* [HELML format definition (en)](https://github.com/dynoser/HELML/blob/master/docs/README-HELML_en.md)
* [Описание формата HELML (ru)](https://github.com/dynoser/HELML/blob/master/docs/README-HELML_ru.md)


## Install
To install HELML, simply use composer:

```bash
composer require dynoser/helml
```

## Usage

```php
use dynoser\HELML\HELML; // it means "the HELML class is in the dynoser\HELML namespace"
require_once 'src/HELML.php'; // path to HELML.php file, or require "autoload.php"

# Example data structure

$data = [
    "key1" => "value1",
    "key2" => [1, 2, 3],
    "key3" => [
        "nested_key" => "nested_value"
    ]
];

# Encode the data structure into a HELML string
$encoded_data = HELML::encode($data);
print($encoded_data)

# Decode the HELML string back into a data structure
$decoded_data = HELML::decode($encoded_data);
```
encoded_data:
```console
key1: value1

key2:
 :--:  1
 :--:  2
 :--:  3

key3
 :nested_key: nested_value

```

# Features
Encode and decode data arrays to/from HELML.

# API

### **HELML::encode**($arr, $url_mode=False)

Encode a array into a HELML string.

- **$arr** The input data array to be encoded.
- **$url_mode** (bool, optional): A boolean indicating if the URL mode should be used. Defaults to False.

Returns:

- string: The encoded HELML string.

### **HELML::decode**($src_rows)

Decode a HELML formatted string or list of strings into a nested dictionary.

- **src_rows** The HELML input as a string

Returns:

- Array: The decoded nested array.

## See also:
 * plugin "HELML" for Visual Studio Code
 * Try online [HELML plugin](https://marketplace.visualstudio.com/items?itemName=dynoser.helml) in [vscode.dev](https://vscode.dev)


# License
This project is licensed under the Apache-2 License.
