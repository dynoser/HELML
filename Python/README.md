# HELML

### This code represents a Python implementation of the HELML class

The class provides functions for encoding and decoding data in the HELML format.

HELML (Header-Like Markup Language) is a markup language similar to the HTTP header format.
(HTTP headers are a specific case of the HELML format, a simple single-level array case).

HELML allows encoding arrays of any complexity
 and then decoding them while preserving data types for true, false, null, integer.
 The format is ideologically close to YAML, JSON, and other array serialization formats,
 intended for use as an alternative in cases where it is convenient.
The main advantage of the HELML format is its simplicity, clarity, and minimalism.
The format works with any data and does not stumble on binary blocks or special characters.
At the same time, the format is intuitively understandable, can be created and edited manually as text.
In most cases, data in HELML will be more compact than in other markup languages.

This class implements two varieties of HELML: multiline format and URL format.

The URL variety of HELML is intended for data transmission in the URL string,
for example, to implement APIs in GET requests. In this case, the format packs data
into a single line and minimizes the number of "inconvenient" characters for the URL.

Main methods of the class:
encode: takes an array of data and converts it into a string using the HELML format.
the second parameter of the method determines whether to use the URL mode.

decode: performs the reverse transformation of encode.
takes a HELML formatted string and converts it back into an array.
automatically determines whether the input data is in URL format or multiline format.

All methods are static and can be used without creating an instance of the class.

Example:

```python
from HELML import HELML

arr = {'One': 1, 'Two': 2, 'Three': [1,2,3], 'Four': (4,5,6)}

enc = HELML.encode(arr)
print(enc)

dec = HELML.decode(enc)
print(dec)
```
Result of encode:
```python
One:  1
Two:  2
Three:
:0:  1
:1:  2
:2:  3
Four:
:0:  4
:1:  5
:2:  6

{'One': 1, 'Two': 2, 'Three': [1, 2, 3], 'Four': [4, 5, 6]}
````
