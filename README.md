
![helml-logo](https://github.com/dynoser/HELML/raw/master/logo/icon.png)

# HELML (Header-Like Markup Language)

HELML (HEader-Like Markup Language) is a marking language similar to the HTTP headlines format.

# Descriptions

[HELML format definition (en)](https://github.com/dynoser/HELML/blob/master/README-HELML_en.md)

[Описание формата HELML (ru)](https://github.com/dynoser/HELML/blob/master/README-HELML_ru.md)


Example (animated demo in Visual Studio Code):

![Demo](https://i.imgur.com/WyGbJmO.gif)

HELML-encoded Array:
```console
A: 123
B
:X: 456
:Y: 789
:Z
::One: 1
::Two: 2
:C: 888
D: 111
```
The same array in JSON:
```json
{
    "A": "123",
    "B": {
        "X": "456",
        "Y": "789",
        "Z": {
            "One": "1",
            "Two": "2"
        }
        "C": "888"
    },
    "D": "111"
}
```



# Implementations

### Python

[Python package](https://github.com/dynoser/HELML/tree/master/Python)

### PHP

[PHP code](https://github.com/dynoser/phpHELML/)

### JavaScript

[JavaScript code](https://github.com/dynoser/HELML/tree/master/JavaScript)


### Visual Studio Code extention

[VsCode ext](https://github.com/dynoser/HELML/tree/master/helml-vscode-plugin)
