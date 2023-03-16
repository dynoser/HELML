<?php
/*
 * This code represents a PHP implementation of the HELML class without dependencies.
 * 
 * The class provides functions for encoding and decoding data in the HELML format.
 * 
 * HELML (Header-Like Markup Language) is a markup language similar to the HTTP header format.
 * (HTTP headers are a specific case of the HELML format, a simple single-level array case).
 * 
 * HELML allows encoding arrays of any complexity
 *  and then decoding them while preserving data types for true, false, null, integer.
 *  The format is ideologically close to YAML, JSON, and other array serialization formats,
 *  intended for use as an alternative in cases where it is convenient.
 *
 * The main advantage of the HELML format is its simplicity, clarity, and minimalism.
 * The format works with any data and does not stumble on binary blocks or special characters.
 * At the same time, the format is intuitively understandable, can be created and edited manually as text.
 * In most cases, data in HELML will be more compact than in other markup languages.
 * 
 * This class implements two varieties of HELML: multiline format and URL format.
 * 
 * The URL variety of HELML is intended for data transmission in the URL string,
 * for example, to implement APIs in GET requests. In this case, the format packs data
 * into a single line and minimizes the number of "inconvenient" characters for the URL.
 *
 * Main methods of the class:
 * encode: takes an array of data and converts it into a string using the HELML format.
 * the second parameter of the method determines whether to use the URL mode.
 *
 * decode: performs the reverse transformation of encode.
 * takes a HELML formatted string and converts it back into an array.
 * automatically determines whether the input data is in URL format or multiline format.
 * 
 * valueEncoder: an internal method that encodes a value (not an array) in the HELML format
 * valueDecoder: an internal method that decodes HELML values back into their original data.
 * 
 * All methods are static and can be used without creating an instance of the class.
*/

class HELML {
    public static function encode($arr, $url_mode = false, $val_encoder = true) {
        $results_arr = [];
        if (!is_array($arr)) {
            throw new InvalidArgumentException("Array required");
        }
        $str_imp = $url_mode ? "~" : "\n";
        $lvl_ch = $url_mode ? '.' : ':';
        $spc_ch = $url_mode ? '_' : ' ';
        self::_encode($arr, $results_arr, $val_encoder, 0, $lvl_ch, $spc_ch);
        return implode($str_imp, $results_arr);
    }

    public static function _encode(
        $arr,
        &$results_arr,
        $val_encoder = true,
        $level = 0,
        $lvl_ch = ":",
        $spc_ch = " "
    ) {
        foreach ($arr as $key => $value) {

            // encode $key in base64url if it contains unwanted characters
            $fc = substr($key, 0, 1);
            $lc = substr($key, -1, 1);
            if (false !== strpos($key, $lvl_ch) || false !== strpos($key, '~') || '#' === $fc  || $fc === $spc_ch || $fc === ' ') {
                $fc = "-";
            }
            if ("-" === $fc || $lc === $spc_ch || $lc === ' ' || !preg_match('/^[[:print:]]*$/', $key)) {
                // add "-" to the beginning of the key to indicate it's in base64url
                $key = "-" . self::base64Uencode($key);
            }

            // add the appropriate number of colons to the left of the key, based on the current level
            $key = str_repeat($lvl_ch, $level) . $key;

            if (is_array($value)) {
                // if the value is an array, call this function recursively and increase the level
                $results_arr[] = $key;
                self::_encode($value, $results_arr, $val_encoder, $level + 1, $lvl_ch, $spc_ch);
            } else {
                // if the value is not an array, run it through a value encoding function, if one is specified
                if (true === $val_encoder) {
                    $value = self::valueEncoder($value, $spc_ch); // Default value encoder
                } elseif ($val_encoder) {
                    $value = call_user_func($val_encoder, $value);
                }
                // add the key:value pair to the output
                $results_arr[] = $key . $lvl_ch . $value;
            }
        }
    }

    public static function decode($src_rows, $val_decoder = true) {
        // If the input is an array, use it. Otherwise, split the input string into an array.
        if (is_array($src_rows)) {
            $str_arr = $src_rows;
        } elseif (is_string($src_rows)) {
            foreach(["\n", "\r", "~"] as $exploder_ch) {
                if (false !== strpos($src_rows, $exploder_ch)) {
                    if ("~" === $exploder_ch) {
                        $lvl_ch = '.';
                        $spc_ch = '_';
                    } else {
                        $lvl_ch = ':';
                        $spc_ch = ' ';
                    }
                    $str_arr = explode($exploder_ch, $src_rows);
                    break;
                }
            }
        } else {
            throw new InvalidArgumentException("Array or String required");
        }

        // Initialize result array and stack for keeping track of current array nesting
        $result = [];
        $stack = [];

        // Loop through each line in the input array
        foreach ($str_arr as $line) {
            $line = trim($line);

            // Skip empty lines and comment lines starting with '#'
            if (!strlen($line) || substr($line, 0, 1) === '#') continue;

            // Calculate the level of nesting for the current line by counting the number of colons at the beginning
            $level = 0;
            while (substr($line, $level, 1) === $lvl_ch) {
                $level++;
            }

            // If the line has colons at the beginning, remove them from the line
            if ($level) {
                $line = substr($line, $level);
            }

            // Split the line into a key and a value (or null if the line starts a new array)
            $parts = explode($lvl_ch, $line, 2);
            $key = $parts[0] ? $parts[0] : 0;
            $value = isset($parts[1]) ? $parts[1] : null;

            // Decode the key if it starts with an equals sign
            if (is_string($key) && ('-' === substr($key, 0, 1))) {
                $key = self::base64Udecode(substr($key, 1));
                if (!$key) {
                    $key = "ERR";
                }
            }

            // Remove keys from the stack until it matches the current level
            while (count($stack) > $level) {
                array_pop($stack);
            }

            // Find the parent element in the result array for the current key
            $parent = &$result;
            foreach ($stack as $parentKey) {
                $parent = &$parent[$parentKey];
            }

            // If the value is null, start a new array and add it to the parent array
            if (is_null($value)) {
                $parent[$key] = [];
                array_push($stack, $key);
            } else {
                // Decode the value if a decoder function is specified
                if (true === $val_decoder) {
                    $value = self::valueDecoder($value, $spc_ch);
                } elseif ($val_decoder) {
                    $value = call_user_func($val_decoder, $value, $spc_ch);
                }
                // Add the key-value pair to the current array
                $parent[$key] = $value;
            }
        }

        // Return the result array
        return $result;
    }
    
    public static function valueEncoder($value, $spc_ch = ' ') {
        $type = gettype($value);
        switch ($type) {
            case 'string':
                if ('_' === $spc_ch) {
                    // for url-mode
                    $need_encode = (false !== strpos($value, '~'));
                    $reg_str = '/^[ -~]*$/';
                } else {
                    $need_encode = false;
                    $reg_str = '/^[[:print:]]*$/u';
                }
                if ($need_encode || !preg_match($reg_str, $value) || (('_' === $spc_ch) && (false !== strpos($value, '~')))) {
                    // if the string contains special characters, encode it in base64
                    return self::base64Uencode($value);
                } elseif (!strlen($value) || ($spc_ch === $value[0]) || ($spc_ch == substr($value, -1)) || ctype_space(substr($value, -1))) {
                    // for empty strings or those that have spaces at the beginning or end
                    return '"' . $value . '"';
                } else {
                    // if the value is simple, just add one space at the beginning
                    return $spc_ch . $value;
                }
            case 'boolean':
                return $spc_ch . $spc_ch . ($value ? 'T' : 'F');
            case 'NULL':
                return $spc_ch . $spc_ch . 'N';
            case 'double':
                if ('_' === $spc_ch) {
                    // for url-mode because dot-inside
                    return self::base64Uencode($value);
                }
                // if not url mode, go below
            case 'integer':
                return $spc_ch . $spc_ch . $value;
            default:
                throw new InvalidArgumentException("Cannot encode value of type $type");
        }
    }

    public static function valueDecoder($encodedValue, $spc_ch = ' ') {
        $fc = substr($encodedValue, 0, 1);
        if ($spc_ch === $fc) {
            if (substr($encodedValue, 0, 2) !== $spc_ch . $spc_ch) {
                // if the string starts with only one space, return the string after it
                return substr($encodedValue, 1);
            }
            // if the string starts with two spaces, then it encodes a non-string value
            $encodedValue = substr($encodedValue, 2); // strip left spaces
            if ($encodedValue === 'N') {
                return null;
            } elseif ($encodedValue === 'T') {
                return true;
            } elseif ($encodedValue === 'F') {
                return false;
            }
            if (is_numeric($encodedValue)) {
                // it's probably a numeric value
                if (strpos($encodedValue, '.')) {
                    // if there's a decimal point, it's a floating point number
                    return (double) $encodedValue;
                } else {
                    // if there's no decimal point, it's an integer
                    return (int) $encodedValue;
                }
            }
            // other encoding options are not currently supported
            return $encodedValue;
        } elseif ('"' === $fc || "'" === $fc) { // it's likely that the string is enclosed in single or double quotes
            $encodedValue = substr($encodedValue, 1, -1); // trim the presumed quotes at the edges and return the interior
            if ("'" === $fc) {
                return $encodedValue;
            }
            return stripcslashes($encodedValue)
        }
        // if there are no spaces or quotes at the beginning, the value should be in base64
        $decoded = self::base64Udecode($encodedValue)
        if (false === $decoded) {
            return $encodedValue; // Fallback if can't decode
        }
        return $decoded;
    }

    public static function base64Uencode($str) {
        $enc = base64_encode($str);
        return rtrim(strtr($enc, '+/', '-_'), '=');
    }
    
    public static function base64Udecode($str) {
        return base64_decode(strtr($str, '-_', '+/'));
    }
}
