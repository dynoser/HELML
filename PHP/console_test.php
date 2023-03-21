<?php
namespace dynoser\HELML;

if (!isset($argv[1])) {
  echo "Please provide a string to encode\n";
  exit(1);
}

// please specify path where HELML.php actually located
require_once dirname(dirname(__DIR__)) . '/phpHELML/src/HELML.php';

$argument = $argv[1];

$arr = HELML::decode($argument);

$back = HELML::encode($arr, true);

echo $back;

file_put_contents("test_req_rows.txt", $back . "\n", \FILE_APPEND);
