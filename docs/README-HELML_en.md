# HELML

## HELML (Header-Like Markup Language)

![helml-logo](https://raw.githubusercontent.com/dynoser/HELML/master/logo/icon.png)

HELML (HEader-Like Markup Language) is a marking language similar to the HTTP headlines format.

For example, you can decode this text from HELML:

```sh
Host: github.com
Accept: image/avif,image/webp
Accept-Encoding: gzip, deflate, br
```

The result is an array `[key] => 'Value'`:

```json
{
	"Host": "github.com",
	"Accept": "image/avif,image/webp",
	"Accept-Encoding": "gzip, deflate, br"
}
```

Helml allows you to create nested arrays, controlling the signs of "`: `", for example:
```sh
Hosts:
 :--: github.com
 :--: www.github.com
```

In json format it will be like this:
```json
{
	"Hosts": [
		"github.com",
		"www.github.com"
	]
}
```

# For what?

I. When JSON does not cope

  - If you need serialization of arrays in which binary data are found, then
The standard JSON encoder will "stumble", and HELML works with any data.

  - Standard JSON does not understand comments.Sometimes they are very missing.

II. Minimalism

  - When you are looking for an alternative to JSON, it turns out that most parsers are bulky,
    and pulling them into your project for protozoa tasks is not rational.

  - HELML coding/decoding algorithms are simple, short and fast.

III. Possibility of selective parsing

   From a HELML file, you can easily select only the sections you need and ignore the rest.
   This allows you to significantly speed up the selection of the necessary data from a large array in the HELML file,
   without wasting time on currently uninteresting data and without occupying memory with this data.

IV. The concept of multi-layering arrays

* HELML supports the concept of multi-layering arrays, which can be useful.
* See ["multilayer arrays"](https://github.com/dynoser/HELML/blob/master/docs/MultiLayerArrays_en.md)

# HELML it's just

In many cases, the data in HELML format can be recorded without connecting any encoder,
simply displaying the data lines in the form of "key: value".

Coding and decoding HELML is performed by simple algorithms, they are concise in any programming language.

HELML is easy to create and edit manually.

Consider the details.

## Empty lines and Comments

- Empty lines are ignored.
- Spaces at the edges of lines are ignored (trimmed and don't matter)
- Lines starting with the sign "#` "are ignored (considered comments).
- Inline comments are not provided.

## Use Base64

Keys and values can be presented in the Base64 encoding.

The "-" sign at the beginning of a key or value indicates that it is encoded in Base64.

For example, four lines below HELML mean the same thing:
```python
# Simple Key: Value
Host: github.com

# Key "Host" encoded in Base64
-SG9zdA: github.com

# Value "github.com" encoded in Base64
# Please note that "-" stands immediately after a colon, without space.
Host:-Z2l0aHViLmNvbQ

# Key and Value are both encoded in BASE64
-SG9zdA:-Z2l0aHViLmNvbQ
```

# Nested arrays

### The colon character "`:`" on the left side of the string controls the array structure.

The count of colons at the beginning of the line means the target nesting level.

Example. Encode this in HELML:
```json
{
	"Host": "github.com",
	"Names": {
		"no_www": "github.com",
		"www": "www.github.com"
	},
	"Test": "The test"
}
```
Result:
```sh
Host: github.com
Names
 :first name: github
 :last name: com
Family: repos
```
As a result, we see indents on the left of nested elements.
These indentations consist of spaces and colons.
The spaces are not important, they are added for the convenience of visual perception.
The colons are important, they indicate the level of nesting.

# Role of colons

Colons have a dual role:

- Colons at the beginning of a line control the structuring of arrays.
- A colon not-at-the-beginning of a line separates "key" from "value".

## Explanations

The colon is the only character other than the line separator that controls the structure of an array.

1. The number of colons at the beginning of a line specifies the target nesting level. It is "**level colons**".
2. After "level colons" are always followed by "**key**".
3. The following colon is either missing or present. It is "**divider colon**".

Any HELML string (except empty strings and comments) has a key and possibly something else.

A HELML string has the following format: `[level colons]key[:[value]]`

* Note that the HELML string always contains the "key" explicitly.
* If "value" is not specified in the string, it is assumed to be empty.

If there are "**level colons**", then they must follow each other without spaces.
The appearance of any other character means the end of "**level colons**" and the beginning of "key".
If there is a colon after "level colons" in the string, then it is "**separating colon**",
which separates "key" and "value".

If there are no "**level colons**" at the beginning of the string, then they are present in the amount of 0,
and in this case we are talking about the zero (root) level of array nesting.

Examples of how colon are parsed:

```python
# three "level colons" and no "separating colon" (key X, value empty)
:::X

# four "level colons", then key "X" and "separating colon", then value Y
 ::::X:Y

# one "level colon", then the key "AAA", then the "separating colon" and the value " BBB:CCC :DDD:"
:AAA: BBB:CCC :DDD:

# zero "colon level" then key "X" and "separating colon" then value "Z"
    X:Z

# zero "colon level" then key "This is a key", no "separating colon" (empty value)
This is a key

# one "level colon" followed by the key "--" followed by a "separating colon" followed by an empty value.
:--:

# one "level colon", then the key " ", then the "separating colon", then the value " : :"
   : : : :
```

## Example deeper nesting

Encode this JSON to HELML:
```json
{
	"A": "123",
	"B": {
		"X": "456",
		"Y": "789",
		"Z": {
			"One": 1,
			"Two": "2"
		},
		"C": "888"
	},
	"D": "111"
}
```

Result:
```sh
A: 123

B
 :X: 456
 :Y: 789

 :Z
  ::One:  1
  ::Two: 2
 #
 :C: 888
#
D: 111
```

Note:
 - the number of "level colons" at the beginning of a line always corresponds to the nesting level of the array elements.
 - the HELML encoder added indents, blank lines and `#` signs at the end of nested structures - this does not mean anything to the parser, but is convenient for visual perception
 - of course, the addition of these symbols, intended for visual convenience, can be turned off


# Explicit creation of sub-arrays

To create a new (deeper) nesting level, you must specify a "key" and an empty "value".

This "key" will become the name of the created sub-array in which nested elements will be placed.

## -- *Note that the main concept of HELML was outlined above, and below we will talk about the nuances*

Consider an example of a NOT correct structure description:

```sh
A: 123
 :B: 456
  ::C: 789
```
In this example, the values for keys B and C will end up in the same place as A, despite the indentation and colons.
Because there is no nested array creation in this example.
Simply increasing the number of indents and "level colons" does not increase the level of nesting.
Extra "level colons" are ignored.

The result of HELML decoding in this example will be:
```json
{
	"A": "123",
	"B": "456",
	"C": "789"
}
```
The number of "level colons" only matters when it is less than the current nesting level.
In this case, the record pointer returns to the nesting level that will correspond to
the specified number of "level colons".


# Two kinds of nested arrays

Nested arrays are created by specifying a "key" and an empty value, and there are two options:
   1) key without "separating colon" (in this case, an empty value is implied)
   2) a key and a "separating colon" after which there is no value.

   - When there is no "separating colon", an array is created with arbitrary keys `{...}`
   - When a "separating colon" ends a line, an array is created with numeric keys `[...]`

It is convenient for compatibility to distinguish between these two kinds of arrays, since in many programming languages
work with "dictionaries" and "lists" is implemented differently.

In JSON, JavaScript, Python, "lists" are usually written in square brackets, e.g.
`[123, 456, 789]`, and arrays with arbitrary keys ("dictionaries", dict) are written in curly braces, for example,
`{"A": 123, "B": 456}`.

To preserve typing, HELML allows distinguishing lists of the form [...] from arrays of the form {...}.
To do this, when creating a key for a nested array, a colon is added to its name.

For example, let's convert this JSON to HELML:
```json
{ "List": ["A","B","C"] }
```
In HELML, this will have a colon after "List":
```python
# Note the : after List, it indicates that this will be a list
List:
 :0: A
 :1: B
 :2: C
```

If you remove this colon, it will correspond to an array in curly brackets:
```json
{ "List": {"0": "A", "1": "B", "2": "C"} }
```

So in HELML, adding a colon after a key at the end of a line allows
indicate that a nested array of the "list" type is being created, that is, the keys in it must
be strictly numeric and consecutive from 0 and up.

For HELML lists, a special key "next number" is convenient, it allows you to write the above example like this:
```sh
List:
  :--: A
  :--: B
  :--: C
```

# Special keys

* If there is no "-" sign at the beginning of the key, then this means a simple case and such a "key" is treated "as is".
* If a key has a "-" sign at the beginning, it indicates a special key.

### List of special keys:
- The special key "`--`" matches the value "next number".
- A special key "`-+`" allows you to change the array layer (see ["multilayer arrays"](https://github.com/dynoser/HELML/blob/master/docs/MultiLayerArrays_ru.md))
- The special key "`-++`" also refers to layering (see the previous paragraph).
- All other key variants starting with "-" are decoded from Base64 (base64url).

## base64url encoding

The difference between the classic Base64 encoding and the "url-safe" (base64url) modification is that
that in the url-variant, the characters "`+`" and "`/`" are replaced by "`-`" and "`_`", and the signs "`=`" at the end are discarded.

This variation of Base64 encoding is commonly used to pass data in a URL string.

The base64url decoder used in HELML is more versatile than the standard base64 decoder,
since it can decode both regular base64 and modified one.

Therefore, keys and values in Base64 format can be encoded both in the usual base64 mode and in the base64url modification.

Note that the special keys `--`, `-+`, `-++` used in HELML are correct for decoding from base64url,
but they are never obtained with correct coding. Therefore, special keys do not intersect with encoded ones.

If the key has the value "`--`", then such a key automatically receives the "next number",
equal to the current number of elements in the nested array being written to.
This makes it possible not to specify key numbers explicitly, and is especially useful for lists.

Example:
```console
--
 :--: X
 :--: Y
--
 :A:
  ::--:  1
  ::--:  2
 :B:
  ::--: 3
  ::--: 4
 :-:
  ::--: ABC
  ::--: DEF
```
Convert it from HELML to JSON:
```json
{
	"0": "X",
	"1": "Y",
	"2": {
		"A": [1, 2],
		"B": ["3", "4"],
		"": [ "ABC", "DEF" ]
	}
}
```
Note:
   * the root level of an array is always considered a "dictionary", not a "list".
   * for the "next number" key, it does not matter whether the entry is in a dictionary or a list.
   * in this example there is a key `:-:` which means the key "empty string".
This is a special case of Base64: after the "`-`" sign, there is an empty string, which in Base64 encoding means an empty string.

# Duplicate keys

The reappearance of a key (that is, the appearance of a key with the same name) entails its overwriting.
The old value is forgotten and replaced with the new one.

For example, this code first specifies the array A, and then replaces it with the string value "Three".
```console
A
:1: One
:2: Two
A: Three
```
Rekeys are important to the concept of layering, it allows values to be overwritten depending on the selection of layers.

# Value encoding

* Simple cases - when the value is suitable for substitution in the "key: value" format.
   In simple cases, which are the majority, the values are presented "as is".

* Special cases - when the value is special (for example, contains binary data), or has a non-string type.

# Number of spaces at the beginning of the value - important

The number of spaces after the "separating colon" (before the value) makes it possible to distinguish between encoding options for the value.
There are three options for the number of spaces: 0, 1, and 2.

- If there is a single space between the "breaking colon" and the value, it is a "simple case".
   in this case "value" is returned simply "as is"
- If there is no space, or two (or more) spaces, these are "special cases" of values.
   Let's consider them in more detail

### Special case values:
! The number of spaces after the "splitting colon" is important,
as it indicates special cases of value encoding.

- If there is no space at the beginning of the value, then:
   - if the value starts with double or single quotes, these are "quote cases".
     - if the quotes are single, then the value inside them is returned, and the quotes are discarded.
     - if the quotes are double, then the value is returned with parsing of special characters (such as `"\n"`)
   - if it is a "-" sign, then the value is assumed to be encoded in Base64
     - if this value is successfully decoded from Base64, the decoded value will be returned.
     - if the value cannot be decoded, the value `null` will be returned.
   - all other options will be passed to the custom handler CUSTOM_FORMAT_DECODER
   - if there is no CUSTOM_FORMAT_DECODER handler, then such a value will be decoded from base64.

- If there are two spaces at the beginning of the value, then:
   - if two spaces are followed by a number, then it will be represented as a numeric type, not a string.
     - if the number does not contain a dot, it will be represented as an integer
     - if the number contains a dot, it will be represented as a float (double)
   - if after two spaces follows:
     - T - will be represented as a boolean value True
     - F - will be represented as a boolean value False
     - N - will be represented as "absence" NULL, or None, depending on the language of the result
     - NAN - will be represented as a numeric value NaN (Not-A-Number, not a number)
     - INF - will be represented as a numeric value Infinity (infinity)
     - NIF - will be represented as a numeric value -Infinity (minus infinity)
     - U - will be represented as "undefined" in JavaScript, or similar to N in other languages
   - if the value after two spaces does not match the options described above, then:
     - for such values, a custom handler CUSTOM_FORMAT_DECODER can be set
     - if a custom decoder is not set, then the value will be returned "as is" (without two spaces

## Quoted values

The option to specify the string in quotes makes sense when:
   - when you need to explicitly set the value to "empty string".
   - when spaces around the edges are important in the value
   - double quotes allow you to specify special characters in slash format, instead of packing in Base64

```python
     # specifying an empty string as a value:
     test:""

     # spaces at the beginning and end will be preserved, and the quotes will be discarded:
     Hello: "Hello World"

     # the result will be the same as in the previous version:
     Hello:' Hello World '

     # the result will be a string with quotes, i.e. the quotes will NOT be stripped.
     # because the space after the colon indicates a "simple case" and the data is returned "as is":
     Hello: "Hello World"

     # Here, the value will be with a newline character inside, and the double quotes will be discarded:
     Hello: "Hello\n World"

     # Here the value "\n" will not be converted to a newline character, the data will be returned as is, but without quotes:
     Hello:' Hello\n World '
```

# Multi-line and single-line HELML

If you "glue" all HELML lines with the tilde `~`, then the parser will understand this character as a "line feed".

It is a "single-line HELML". It differs from "multi-line HELML" by the line separator.

One-line HELML is useful when for some reason you can't use "newline".
For example, if you need to put a HELML code in a URL, or in a command line argument, etc.

This is an easy way to pass an arbitrary array as a string parameter while preserving its structure and data types.

In addition, there is a special URL mode that replaces escape colons and spaces with "`.`" and "`_`" respectively.
The choice of these characters to replace is because the "urlencode" (RFC 3986) transformation does not change them.
A sign of encoding in this mode is the presence of the `~` character at the end of a single-line HELML line.

Thus, two variants of a one-line HELML are distinguished:
  - a simple one-line HELML, when the lines are concatenated through the `~` sign
  - HELML URL mode, which additionally replaces colons and spaces with `.` and `_`.

All options are decoded by the same decoder, the encoding option used is determined automatically.

# Results

* HELML format allows you to encode arrays of arbitrary structure and then decode them back
preserving the basic data types (integer, true, false, null, string, and some others)

* HELML is ideologically close to JSON and YAML, designed for array serialization and configuration descriptions.

* The main advantage of the HELML format is its simplicity and minimalism.

* The format does not stumble on binary data and special characters. Almost any array can be converted to HELML,
then transfer to another platform and restore the original data from HELML there.

* The format is intuitive, can be easily created and edited by hand.

* HELML implements the ["multilayer concept"](https://github.com/dynoser/HELML/blob/master/docs/MultiLayerArrays_ru.md),
   which allows you to get values that differ depending on the selection of layers.

* In most cases, data in HELML will be more compact than in other markup languages.
