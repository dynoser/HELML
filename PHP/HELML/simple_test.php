<?php
use dynoser\HELML\HELML;

require_once 'src/HELML.php';

$a = [
    'A' => [2 => 2, 0 => 3],
    'B' => [1,2,3]
    ];

$data = [
    "key1" => "value1",
    "key2" => [1, 2, 3],
    "key3" => [
        "nested_key" => "nested_value"
    ]
];

print_r(HELML::encode($data));


HELML::$CUSTOM_FORMAT_DECODER = function($value) {
    if (substr($value, 0, 1) === 'T') {
        $timestamp = (int)substr($value, 1);
        if ($timestamp) {
            return date("d-m-Y", $timestamp);
        }
    }
    return $value;
};

$arr = HELML::decode(<<<HELML
        Testime:  T12342345
        Float:  0.1
        X:  N
        P:  U
        Q:  Test
        
        A: One
        B: Two
        
        P:
        :0: A
        :1: B
        
        C
        :D: 1
        :E: 2
        :F: 3
        
        # Comment line
        
        D
        :E
        ::F
        :::G:  433
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

// Decode back and compare with $arr
$back_arr = HELML::decode($enc);

if ($arr == $back_arr) {
    echo "Arrays are equal\n";
}


$enc2 = HELML::encode($arr, true);

echo "HELML-url-encode:\n" . $enc2;

$arr2 = HELML::decode($enc2);

print_r($arr2);

if ($arr == $arr2) {
    echo "Arrays in URL-mode are equal\n";
}