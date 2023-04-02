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

III. Layer specification key

 - HELML uses a special key "-+" to enable layering.
 - After the "-+" key, a colon can be added to specify a particular layer name.
 - If no layer name is specified after the "-+" key, it will transition to the "next layer".
 - Layering is not used until the "-+" key is used.

IV. Automatic return to layer 0

 - Whenever the nesting level of an array changes, the name of the current layer is reset to 0.
 - In particular, when creating a new nesting level, the current layer becomes 0.
 - Also, when returning to the previous nesting level, the current layer becomes 0.

V. The value [_layers]

 - If other layers besides 0 are specified in the array description, an additional key [_layers] will be included in the results, which contains a list of all the layers mentioned in the array description.
 - If no layers are mentioned in the array description, the [_layers] list will not be added to the results.

Examples

    Let's consider the simplest layered array, in which only one value A[test] is specified: