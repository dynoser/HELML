
# HELML specification

## Control characters:

  - `":"` - `LevelChar` - at the beginning of the line indicates the nesting level of elements, then it separates `key` and `value`.
  - `" "` - `SpaceChar` - has value before `value` (i.e. after `key` and `LevelChar`). Allows you to distinguish between encoding options for a value.
  - `"-"` - `Base64Url` - the presence of a character at the beginning of `key` or `value` means representation encoded in Base64url.
  - `"~"` - `AltNewLine` - replaced with "\n". Alternative "line feed".

## Not significant lines

  - Blank lines and whitespace characters at the edges of lines have no meaning and are discarded.
  - If there is a `#` (or `//`) at the beginning of the line after stripping whitespace characters, then this is a comment line

## Significant strings

All HELML lines, except empty lines and comments, we will call "significant lines".

Such strings contain `key` and `value`.

A `key` is always explicitly present in a significant string.

The value of `value` may be omitted, in which case it is assumed that the value is *formally empty*.

The format of meaningful HELML strings can be described by the following regular expression:

```javascript
/^(?P<level>\s*:*)\s*(?P<key>[^:\s]+)(?:\s*:\s*(?P<value>.*))?$/
```

## Meaning of significant strings

Each significant line writes to the current array an element with the key `key` and the value specified in `value`.

If the value of `value` is *formally empty*, it means that an array of the next nesting level is created.

If the following lines write to the created array, this is indicated by an increase in the number of LevelChar at the beginning of the line.

The number of LevelChars at the beginning of the line must correspond to the nesting level of the array being written to.

If the number of LevelChars in the line has decreased (compared to the lines above), then this means the end of writing to the nested array and returning to writing to the array of the previous level.

## Root level of the array

At the beginning of HELML decoding, the root level of the array has already been created, and the elements are written to it.

All strings with a LevelChar count of 0 (i.e., no LevelChars) write to the root level of the array.

## keys

Keys are always of type "string".

Because the key can be represented as Base64Url encoded, the string value of the key can contain any characters.

There are two options for representing the key:
  1. simple key (don't start with `-` prefix)
  2. special keys (start with `-` prefix)

### Simple keys

All keys without the `-` prefix are simple.
They are interpreted "as is" (but spaces around the edges are cut off).

### Special keys

All keys prefixed with `-` are special. The presence of this prefix always means that further characters must match the Base64Url encoding.

There are *special* keys: these are all combinations of 1 or 2 characters `-` and `+` after the `-` prefix. Such keys match Base64Url, but they are never obtained when data is correctly encoded in Base64Url.

*special* keys must either be processed according to their purpose.

All special keys (other than *special* which are processed according to their special purpose) must be decoded from Base64url.

### Special special key "next number"

The key "`--`" means "*the next number in the current array*". When decoding, such a key is replaced by a string representation of a number equal to the current number of elements in the array being written to.
 

### Support for special keys in decoders

The HELML decoder must support the special option `--` "next number".
Support for other special keys is optional and implementation dependent.

## Values

The number of `SpaceChar` characters before the `value` value is either 1 or otherwise.

### Simple view

If the number of `SpaceChar` characters before `value` is 1, then `value` is treated "as is" (spaces around the edges are discarded)

### Special value representations

If the number of `SpaceChar` characters before `value` is not equal to 1, then these are special cases of encoding `value`.

  - prefix `"-"` before `value` means that `value` is a string encoded in Base64Url
  - if `value` is enclosed in double or single quotes, they are discarded.
  - if `value` is enclosed in double quotes, then character escaping is additionally processed, at least for `\n`, `\r`, `\t`, `\0`, `\\`.
  - if `value` can be interpreted as an integer decimal number, then it gets a numeric type.
  - if `value` contains the character "`.`" and can be interpreted as a fractional number, then it gets a fractional type.
  - if `value` has a match in the lookup table, then the corresponding value is obtained.
The mapping table depends on the implementation language.

Correspondence table example:

| from | to |
| :---: | --- |
| **T** | true |
| **F** | false |
| **N** | null |
| U | undefined |
| NAN | NaN |
| INF | Infinity |
| NIF | -Infinity |

- if `value` does not match any of the above rules, it is either decoded by the custom handler, if one is set, or interpreted "as is".

# Examples

An array in HELML markup and then the same in JSON markup:

HELML:
```sh
One: 1
Two: Test

Subarray:
  :123: 456

  :Sub2:
    ::title: X-Y coordinates
    ::X-sub-key:  -774
    ::Y-sub-key:  888
  
  :yes:  T
  :not:  F
  :any:  N

X:  4444
Y:  55.66
```
JSON:
```json
{
	"One": "1",
	"Two": "Test",
	"Subarray": {
		"123": "456",
		"Sub2": {
			"title": "X-Y coordinates",
			"X-sub-key": -774,
			"Y-sub-key": 888
		},
		"yes": true,
		"not": false,
		"any": null
	},
	"X": 4444,
	"Y": 55.66
}
```