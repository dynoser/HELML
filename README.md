
![helml-logo](logo/icon.png)

# HELML (Header-Like Markup Language)

It is a marking language similar to the HTTP headlines format.

Example:

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
This HELML-code is equivalent to this JSON-array:
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

# Descriptions

[HELML format definition (en)](./README-HELML_en.md)

[Описание формата HELML (ru)](./README-HELML_ru.md)


# Implementations

### Python

[Python package](./Python)

### PHP

[PHP code](./PHP)

### JavaScript

[JavaScript code](.JavaScript)

