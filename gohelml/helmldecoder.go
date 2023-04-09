package gohelml

import (
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type SpecTypeValues struct {
	N   *interface{}
	U   *interface{}
	T   bool
	F   bool
	NAN float64
	INF float64
	NIF float64
}

var specTypeValues = SpecTypeValues{
	N:   nil,
	U:   nil,
	T:   true,
	F:   false,
	NAN: math.NaN(),
	INF: math.Inf(1),
	NIF: math.Inf(-1),
}

type CustomValueDecoder func(string, string) (interface{}, error)
type CustomFormatDecoder func(string) (interface{}, error)

var customValueDecoder CustomValueDecoder = nil
var customFormatDecoder CustomFormatDecoder = nil

func Decode(src interface{}, layersList []int) (map[string]interface{}, error) {
	var lvlCh, spcCh string = ":", " "
	var layerInit int = 0
	var layerCurr int = layerInit
	var minLevel int = -1

	layerMap := make(map[int]bool)
	for _, layer := range layersList {
		layerMap[layer] = true
	}

	layerMap[layerInit] = true
	allLayers := make(map[int]bool)
	allLayers[layerInit] = true

	var strArr []string

	switch src := src.(type) {
	case string:
		exploderChs := []string{"\n", "\r", "~"}
		for _, exploderCh := range exploderChs {
			if strings.Contains(src, exploderCh) {
				if exploderCh == "~" && strings.HasSuffix(src, "~") {
					lvlCh = "."
					spcCh = "_"
				}
				strArr = strings.Split(src, exploderCh)
				break
			}
		}
	case []string:
		strArr = src
	default:
		return nil, errors.New("Array or String required")
	}

	result := make(map[string]interface{})
	stack := make([]string, 0)

	for _, line := range strArr {
		line = strings.TrimSpace(line)
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}

		level := strings.Count(line, lvlCh)
		line = strings.TrimPrefix(line, strings.Repeat(lvlCh, level))

		parts := strings.SplitN(line, lvlCh, 2)
		key := parts[0]
		if key == "" {
			key = "0"
		}
		value := ""
		if len(parts) > 1 {
			value = parts[1]
		}

		if minLevel < 0 || minLevel > level {
			minLevel = level
		}

		extraKeysCnt := len(stack) - level + minLevel
		if extraKeysCnt > 0 {
			stack = stack[:len(stack)-extraKeysCnt]
			layerCurr = layerInit
		}

		parent := result
		for _, parentKey := range stack {
			parent = parent[parentKey].(map[string]interface{})
		}

		if strings.HasPrefix(key, "-") {
			if key == "--" {
				key = fmt.Sprintf("%d", len(parent))
			} else if key == "-+" {
				if value != "" {
					layerCurr, _ = strconv.Atoi(value)
				} else {
					if _, ok := allLayers[layerCurr]; ok {
						layerCurr++
					}
				}
				allLayers[layerCurr] = true
				continue
			} else {
				decodedKey, err := base64Udecode(key[1:])
				if err == nil {
					key = decodedKey
				}
			}
		}

		if value == "" {
			parent[key] = make(map[string]interface{})
			stack = append(stack, key)
		} else if layerMap[layerCurr] {
			var decodedValue interface{}
			var err error

			if customValueDecoder != nil {
				decodedValue, err = customValueDecoder(value, spcCh)
			} else {
				decodedValue, err = valueDecoder(value, spcCh)
			}

			if err != nil {
				return nil, err
			}

			parent[key] = decodedValue
		}
	}

	if len(allLayers) > 1 {
		keys := make([]int, 0, len(allLayers))
		for k := range allLayers {
			keys = append(keys, k)
		}
		result["_layers"] = keys
	}

	return result, nil
}

func valueDecoder(encodedValue, spcCh string) (interface{}, error) {
	firstChar := string(encodedValue[0])
	if firstChar == spcCh {
		if !strings.HasPrefix(encodedValue, spcCh+spcCh) {
			return encodedValue[1:], nil
		}

		slicedValue := strings.TrimLeft(encodedValue, spcCh)
		if num, err := strconv.ParseFloat(slicedValue, 64); err == nil {
			return num, nil
		} else if val, ok := specTypeValues[slicedValue]; ok {
			return val, nil
		} else if customFormatDecoder != nil {
			return customFormatDecoder(encodedValue)
		}

		return encodedValue, nil
	} else if firstChar == "\"" || firstChar == "'" {
		trimmedValue := encodedValue[1 : len(encodedValue)-1]
		if firstChar == "'" {
			return trimmedValue, nil
		}
		return strconv.Unquote("\"" + trimmedValue + "\"")
	} else if firstChar == "-" {
		return base64Udecode(encodedValue[1:])
	}

	if customFormatDecoder != nil {
		return customFormatDecoder(encodedValue)
	}

	return base64Udecode(encodedValue)
}

func base64Udecode(str string) (string, error) {
	data, err := base64.URLEncoding.DecodeString(str)
	return string(data), err
}
