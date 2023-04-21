# HELML Multilayering

## HELML (Header-Like Markup Language)

![helml-logo](https://raw.githubusercontent.com/dynoser/HELML/master/logo/icon.png)

Its addition to [HELML format description](https://github.com/dynoser/HELML/blob/master/docs/README-HELML_en.md)

# Multilayer Arrays

The concept of multilayer arrays allows you to bind values to different layers of the array, so that when
when reading, it was possible to request the choice of layers, the values of which will be combined into the final array.

This is useful when you need to get arrays with minor changes depending on the read parameters.

## Example: Debug options

For example, we create a file with a description of the settings for some program, and we want some settings to be
replaced by others in debug mode. These alternate settings can be linked to a separate layer, we'll call it "dbg".
Next, when reading the configuration, we will indicate whether to overlay the "dbg" layer on top of the main layer.
As a result, by requesting the overlay of the "dbg" layer, we will read the array in which, on top of the main layer
those values that will be taken from the "dbg" layer will be "imposed".

## Example: multilingual

Let's say that among the program settings there is a hello parameter with the value "Hello World!".
We want this value to change to "Здравствуй мир!" when using the Russian language, and we also want to be able to set
this value for any language in general. In the concept of layering, we add this value to the layer, which we will call "ru".
Further, when reading the array, we will specify a layer with the name of the current language for overlay.
In the case of the Russian language, this name will be "ru", and when reading the array, we will get an array,
in which the hello parameter will have the value "Здравствуй мир!", because the layer values are "ru"
will be superimposed on top of the main layer.

## Example: many layers

By combining the above examples, we can additionally request the "ru" and "dbg" layers to obtain an array as output,
in which the values will be changed according to the "ru" and "dbg" layers.

We can define any number of layers and associate them with any parameters.
Then, when we request a list of any layers, we get a union of the corresponding parameters.
If the same parameter is set in multiple layers, we will get the most recent value.
Each subsequent value replaces the previous one, and we always get the latest value from all options.

# Multilayering in the HELML Language

Multiple layers of a HELML array are represented as arrays with the same structure but different values.

When requesting any layer or combination of layers, we get the same array nesting structure as a result,
however, the values in them will be the result of combining the values from all the specified layers.

Arrays are considered not as values, but as a structure, a framework.

If we request non-existing layers, we will get an empty structure (a framework in which there will be no values).

If we request existing layers, we will get a structure in which values corresponding to these layers will be inserted.

By existing layers, we mean those layers that have values associated with them.

# Implementation Features

I. Layer `0`

 - Layer `0` is the "default" layer.
 - When layering is not used, layer `0` is actually used.
 - When an array is described without specifying layers, all its elements are tied to layer `0`.
 - When reading an array without specifying layers, layer `0` is read.

II. Layer names
 - The layer name can be either an number or a non-empty string.
 - If the layer name is a number, then it is possible to go to the "next layer" using the `-+` key.
 - If the layer name is non-number, then using the `-+` key will jump to the "default layer".

III. Key `-+`
  - The `-+` key allows you to temporarily change the name of the current layer to which the values are bound.
  - You can put a colon after the `-+` key and specify a specific layer name.
  - It is possible not to put a colon after the `-+` key, and:
    - this will go to the "next layer" if the name of the current layer is a number
    - this will fallback to the "default layer" if the current layer name is not a number.
  - When changing the nesting level of an array, the name of the current layer is set to "default layer".
    - In particular, when creating a new nesting level, the current layer will become the "default layer".
    - And also, when returning to previous nesting levels, the current layer will become the "default layer".

IV. Key `-++`
  - The `-++` switch allows you to set the layer name as "default layer" and as "current layer".
  - You can put a colon after the `-++` key and specify a specific layer name
  - You can not put a colon after the `-++` key, it will mean the layer name `0`
  - If after `-++` there is a colon and an empty value, it means the same as the previous paragraph.

V. Meaning of `[_layers]`
  - If layers other than `0` are specified in the array description, we will get an additional layer in the result array
the `[_layers]` key, which will contain a list of all layers mentioned in the array description.
  - If other layers are not mentioned in the array description, the [_layers] key will not be added to the result.
  - Layer names in this list are always of the hidden type, even numbers.

## About the difference in the use of keys
The `-++` and `-+` options are for two different usages.

The `-++` switch is convenient because of the simplicity of its logic: "switching layers is always done explicitly."
Set the name of the layer, and all further values will be tied to it,
until we explicitly specify another layer. Very simple, no nuances.

The `-+` switch is for a more subtle approach when we use the auto-return mechanism on
"default layer". In addition, this key allows you to use incremental change of numeric
layer names. The use of this key requires an understanding of these non-obvious nuances of how it works.

You can also say that the `-++` switch allows you to change the current layer "globally", and further values
will bind to the specified layer until it is explicitly changed.
And the `-+` key allows you to change the current layer "locally", that is, the values will be tied to the specified
layer either until the nesting level of the array is changed, or until the layer name is changed by another key.

# Examples

1. Consider the value `A[test]`, which is different in three different layers:
```console
A
  :test: Layer '0'
  :-+
  :test: Layer '1'
  :-+
  :test: Layer '2'
  # Create a sub-array [B]
  :B
    # array nesting has changed so the "default" layer is included and it's '0'
    ::X: Layer '0'.
```

2. Achieve a similar result as in the previous example using the `-++` key
```console
A
  # initially set layer '0'
  :test: Layer '0'

  # explicitly set layer '1'
  :-++:1
  :test: Layer '1', the line above explicitly specifies the layer name
 
  # explicitly set layer '2'
  :-++:2
  :test: Layer '2'
 
  # Create a sub-array [B]
  :B
    # reset layer name to '0'. If this is not done, the recording will continue to layer '2'
    ::-++
    # (key with no value, which means setting the value to '0')
    ::X: Layer '0'.
```

In the first example, we use the "-+" key twice to go to the "next layer".
Since initially we have layer 0, the first transition will be to layer 1, the second to layer 2.
In the second example

Now if we read this array with default parameters, then in both examples we get:
```json
{
"A": {
"test": "Layer '0'",
"B": {
"X": "Layer '0'."
}
},
"_layers": ["0", "1", "2"]
}
```

As expected, we got the value `A[test]` from layer '0', because by default
only layer '0' data is requested.

If we read the array by asking for layers 0 and 2, we get the following result in both examples:

```json
{
"A": {
"test": "Layer '2'",
"B": {
"X": "Layer '0'."
}
},
"_layers": ["0", "1", "2"]
}
```

As you can see, we get the value of `A[test]` from layer '2'.
In value A[B] we get from layer '0' since it is not defined for layer '2'.

Note that the result is the [_layer] key, which contains a list of all the layers mentioned in the array.

## Language selection example

```console
     name: Program name
     msg: Press "START"

     -+:ru
     msg: Press "START"

     -+:de
     msg: Drucke "START"

     -+
     hello: Test hello
```

In this example, the default decoding will give the following result:
```json
{
"name": "Program name",
"msg": "Press \"START\"",
"hello": "Test hello",
"_layers": [0, "ru", "de"]
}
```
In this example, pay attention to the `-+` key before the string "hello".
Here, going to the "next layer" will return layer `0`, since the value of "de" is not numeric.
If this is not done, then "hello" will be tied to the "de" layer.

Recall again that the "current layer" is set to '0' in the following cases:
  - upon any change of the current nesting level
  - when explicitly specifying this layer: `"-+:0"`
  - when specifying `"-+"` without parameters, if the current layer name is not numeric.

It is important not to forget to return the entry to layer `0` if a jump to another layer was made above.