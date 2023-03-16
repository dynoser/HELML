<?php

require_once 'src/HELML.php';

$arr = HELML::decode(<<<HELML
        Float:  0.1
        X:  N
        Z:  NaN
        P:  U
        Q:  Test
        
        A: One
        B: Two
        
        C
        :D: 1
        :E: 2
        :F: 3
        
        # Comment line
        
        D
        :E
        ::F
        :::G:  433
        :::H:  NaN
        ::M: qqq
        
        -Axxn: X
        
        Multiline:" Multi-line\\nValue "
        OneLine:' One-line\\nValue '
        
        Value with semicolon: Lets get started: Go!
        Value with rightspace:'This value have space in the end '
        
        Key contain right space : Hello
        Key contain ~ test: Hello1
        Value contain: ~char~
        
HELML);

print_r($arr);

$enc = HELML::encode($arr, false);

echo "HELML-Encode:\n" . $enc;

$enc2 = HELML::encode($arr, true);

echo "HELML-url-encode:\n" . $enc2;

$arr2 = HELML::decode($enc2);

print_r($arr2);

