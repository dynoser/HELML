# HELML

![helml-logo](logo/icon.png)
## HELML (Header-Like Markup Language)

HELML (HEader-Like Markup Language) is a marking language similar to the HTTP headlines format.

For example, this text in HELML format:

```console
Host: github.com
User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0
Accept: image/avif,image/webp,*/*
Accept-Language: ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate, br
Referer: https://github.com/dynoser/HELML/README.md
```

If you decode this text through HELML.decode, you get an array `[key] => 'Value'`, something like this:

```console
[
    'Host' => 'github.com',
    'User-Agent' => 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0',
...
]
```

# Empty lines and comments

- Empty lines are ignored.
- The lines-comments begin with the sign "`#`".
- Comments are not provided inside the lines, only the entire line can be made.

> 
    You can add as many blank lines as you like, where they are not important.
    You can comment out some lines at the beginning of the line.


# Nested arrays

## The HELML format supports any array-structure, with no restrictions on nesting levels.

### The colon character "`:`" controls the array structure.

This is a key point, consider it more details. Let's start with an example.

Encode this array in HELML:
```console
[
    'Host' => 'github.com',
    'Names' => [
        'no_www' => 'github.com',
        'www' => 'www.github.com
    ],
    'Test' => 'The test'
]
```
Result:
```console
Host: github.com
Names
:no_www: github.com
:www: www.github.com
Test: The test

```
## How the colon "`:`" works

The colon is the only character other than the line separator that controls the structure of an array.

1. The number of colons at the beginning of a line specifies the nesting level. Let's call it "**level colons**".
2. The following colon is either missing or present. Let's call it "**divider colon**".

If there are no "**level colons**" at the beginning of the line, then they are present in the amount of 0.

- If the "**divider colon**" is present, it splits the line into "key" and "value".
- If the "**divider colon**" is absent, it means creating a nested array.

> 
    In the example above, the line "Names" without colons means that
    there are 0 "**level colons**" in it, and the "**divider colon**" is absent.
    As a result, this line means creating a sub-array in the key named [Names].


## Another example.Deeper nesting

We encode such an array in HELML:
```console
[
    'A' => 123,
    'B' => [
        'X' => 456,
        'Y' => 789,
        'Z' => [
            'One' => 1,
            'Two' => 2
        ]
        'C' => 888
    ],
    'D' => 111
]
```

Result:
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

# Some nuances of nesting control

You may have questions: what will happen if you write, for example, like this:

```console
A:123
:B:456
::C:789
```
- Question: Where will B and C go?
- Answer: They will go to the same place as A, that is, to the root level of the array.
- Why?
>
     Because in this example there is no creation of sub-arrays.
     Increasing the number of "level colons" does not create sub-arrays.
     The creation of sub-arrays must be explicit.
     In other words, if the number of "level colons" is greater than
      current nesting level, it doesn't matter.

     But if it's less, then it matters.
    
     In fact, the number of "level colons" indicates whether
     whether we go back to the previous levels of nesting.
     If the number of "level colons" is less than the current nesting level,
     then we return back to the level that will correspond to them.


Above, we have described everything related to managing the nesting structure of arrays.

Now let's move on to considering the encoding of values.



# Value encoding

- in simple cases, which are the majority, the values are encoded as we discussed above.
  
>
     Simple cases - this value is suitable for simple substitution in the "key: value" format.

     Special cases are when the value is special (for example, binary), or when it is important to specify its type.

     For example, if the value starts with a space, contains non-printable characters, and so on.

- the value can always be represented in Base64 encoding (as well as Base64url)

>
     If there is no space after the "breaking colon", then the value is assumed to be Base64 encoded.
     These two lines are equivalent:

     A: test
     A:IFRlc3Q=
     # in this case "IFRlc3Q=" is the Base64 encoded string "Test" and there is no space.

! The number of spaces after the "breaking colon" is important,
   it indicates special cases of value encoding.

- If there is a single space between the "breaking colon" and the value, it is a "simple case".
- If there is no space, or there are two or more spaces, these are "special cases".
- If there is no space, then:
   - if the value starts with double or single quotes, these are "quote cases".
     - if the quotes are single, then the value inside them is returned, and the quotes are discarded.
     - if the quotes are double, then the value is returned with parsing of special characters (such as `"\n"`)
   - if these are not quotes, then the value is assumed to be encoded in Base64 (or Base64url)
     - if this value is successfully decoded from Base64, the decoded value will be returned.
     - if it fails to decode, the value will be returned as is (not recommended scenario!)
- If there are two spaces, then this applies to cases of strong typing:
   - if two spaces are followed by a number, then it will be represented as a number, not as a string.
     - if the number contains a dot, it will be represented as a float
     - if the number does not contain a dot, it will be represented as an integer
   - if after two spaces follows:
     - T - will be represented as a boolean value True
     - F - will be represented as a boolean value False
     - N - will be represented as "absence" NULL, or None, depending on the language of the result

>
     For example, depending on the number of spaces, 123 will be represented as a number, or as a string:
     A: 123 -- if one space, then 123 will be returned as a string
     A: 123 -- if two spaces, then 123 will be returned as an integer
    
The option to specify the string in quotes makes sense when:
   - when spaces around the edges are important in the value
   - when we explicitly want to specify an empty string, avoiding any comprehension ambiguity
   - double quotes allow you to specify special characters in slash format without packing the value in Base64

>
     # explicitly specifying an empty string as a value:
     test:""

     # here the spaces at the beginning and end of the string will be preserved, and the quotes will be dropped:
     Hello: "Hello World"

     # here the result will be exactly the same as in the previous version:
     Hello:' Hello World '

     # here the value will be a string with quotes, the quotes will not be stripped.
     # because the space after the colon indicates a "simple case" and the data is returned "as is":
     Hello: "Hello World"

     # Here, the value will be with a newline character inside, and the double quotes will be discarded:
     Hello: "Hello\n World"

     # Here the value "\n" will not be converted to a newline character, the data will be returned as is, without quotes:
     Hello:' Hello\n World '



# Key encoding

- There are only two options for encoding keys:
   1) simply "as is",
   2) either encoded in Base64 (Base64url)
  
A sign that the key is encoded in Base64 is the presence of a "-" sign at the beginning.

For example:
>
     ABC: Test -- same as line below
     -QUJD: Test -- here "QUJD" is "ABC" in Base64 encoding, and the "-" sign indicates encoded.


# Duplicate keys

>
     Q: -What happens if the same key occurs several times?
     A: -The next key will replace the previous one.

Theoretically, it would be possible to make it possible to "append" elements to previously given arrays.
However, such an approach would create room for ambiguous interpretation of the code.
Therefore, at least in the current implementation, the reappearance of a key always entails overwriting it.
The old value is completely forgotten and replaced with the new one.
For example, this code first specifies the array A, and then replaces it with the string value "Three".
```console
A
:1:One
:2:Two
A:Three
```
It is assumed that repeated keys are the result of manual editing.
Either this is a bug, or this is to undo the data above instead of commenting it out.


# Results

The HELML format allows you to encode arrays of arbitrarily complex structure.
and then decode them while preserving the basic data types (true, false, null, integer)
This format is ideologically close to YAML, JSON, and other array serialization formats,
and is intended to be used in place of them in some cases where it is more convenient.

The main advantage of the HELML format is its simplicity and minimalism.
The format works with any data, does not stumble on binary blocks and special characters.
At the same time, the format is intuitive and can be created and edited manually.
In most cases, data in HELML will be more compact than in other markup languages.


# URL mode

Change line separators to "~", control colons to dots ".", control spaces to underscores "_",
and we get a single string that can easily be used as a GET parameter for a URL, or as a command line argument.
In this form, the HELML format is visually less clear than in the multiline format, but "urlencode" is converted very compactly.
The choice of characters to replace is due to the fact that the "urlencode" (RFC 3986) transformation does not change them.
Perhaps this is the simplest way to pass an arbitrary array in one URL line while preserving its structure and data typing.
