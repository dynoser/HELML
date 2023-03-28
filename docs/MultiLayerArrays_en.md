# HELML

## HELML (Header-Like Markup Language)

![helml-logo](https://raw.githubusercontent.com/dynoser/HELML/master/logo/icon.png)

Its addition to [HELML format description](https://github.com/dynoser/HELML/blob/master/docs/README-HELML_en.md)


# Multidimensional Arrays

The concept of multidimensionality allows for binding values to different layers of an array and, when reading,
requesting a certain list of "layers" whose values will be combined into the final array.

This is convenient when you need to obtain arrays with insignificant changes that depend on some parameters.

For example, we create a file with a description of program settings.
We want some settings to be replaced with some other ones in debug mode of the program.
We set these alternative settings for a layer that we call, for example, "dbg".
Next, when extracting the configuration, we specify that we want to extract the main layer and the "dbg" layer.
As a result, we will get an array in which values from the "dbg" layer will be "overlayed" on top of the main layer.

Another example.
Suppose the program settings include a parameter hello with a value of "Hello World!".
We want this value to be changed to "Здравствуй мир!" when using the Russian language.
In the concept of multidimensionality, we simply add this value to a layer called, for example, "ru".
When reading the settings file, we will additionally specify the layer with the name of the current language for reading.
If the language is "ru", and we request an additional layer "ru" when reading, then we will get an array as a result,
in which the hello parameter will have a value of "Здравствуй мир!".
This is because a layer with the name "ru" will be overlaid on top of the original layer, in which the value of the hello parameter is different.

By combining the above examples, we can additionally request the "ru" and "dbg" layers to obtain an array as output,
in which the values will be changed according to the "ru" and "dbg" layers.

We can define any number of layers and associate them with any parameters.
Then, when we request a list of any layers, we get a union of the corresponding parameters.
If the same parameter is set in multiple layers, we will get the most recent value.
Each subsequent value replaces the previous one, and we always get the latest value from all options.

# Multidimensionality in the HELML Language

Layers of a HELML array can be thought of as arrays with the same structure but different values.

When requesting any layer or combination of layers, we will get the same structure of nested arrays as a result.

Arrays are considered not as values, but as a structure, a framework.

If we request a non-existent layer, we will get an empty structure of arrays (a framework with no values).

If we request existing layers, we will get a structure in which values corresponding to these layers will be inserted.

By existing layers, we mean those layers that are associated with some values.

# Implementation Features

I. Layer 0

 - Layer 0 is the "default" layer.
 - When layering is not used, layer 0 is actually used.
 - When an array is described without specifying layers, all its elements are tied to layer 0.
 - When reading an array without specifying layers, layer 0 is read.

II. Layer names

 - The name of a layer can be either an integer or a non-empty string.
 - If the layer name is a number, transitioning to the "next layer" will increase that number by 1.
 - If the layer name is not a number, transitioning to the "next layer" will return to layer 0.

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