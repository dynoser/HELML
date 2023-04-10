package gohelml_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dynoser/HELML/tree/master/gohelml"
)

func TestDecoder(t *testing.T) {
	h := gohelml.HELML{}
	h.ADD_LAYERS_KEY = false

	testCases := []struct {
		name    string
		srcRows string
		want    map[string]interface{}
		layers  *[]string
	}{
		{
			name: "Layers NEXT test",
			srcRows: `
			A:
				:1:  123
				:-+:
				:1:  234
				:-+
				:1:  345
			`,
			want: map[string]interface{}{
				"A": map[int]interface{}{
					1: 234,
				},
			},
			layers: &[]string{"0", "1"},
		},
		{
			name: "Layers NEXT test 2",
			srcRows: `
			A:
				:1:  123
				:-+:
				:1:  234
				:-+
				:1:  345
			`,
			want: map[string]interface{}{
				"A": map[int]interface{}{
					1: 345,
				},
			},
			layers: &[]string{"0", "2"},
		},
		{
			name: "Layes named test",
			srcRows: `
			A:
				:1:  123
				:-+: RU
				:1:  234
				:-+: EN
				:1:  345
			`,
			want: map[string]interface{}{
				"A": map[int]interface{}{
					1: 234,
				},
			},
			layers: &[]string{"0", "RU"},
		},
		{
			name: "KeyNum-nested-arrays",
			srcRows: `
			A:
				:1:  456
				:2:
					::5:  123
			`,
			want: map[string]interface{}{
				"A": map[int]interface{}{
					1: 456,
					2: map[int]interface{}{
						5: 123,
					},
				},
			},
		},
		{
			name: "Mixed nested arrays",
			srcRows: `
			A:
				# B will skip because it is not numeric
				:B:  456
				:1:
					::5:  123
					::6
						:::A: X
						:::B: Y
			`,
			want: map[string]interface{}{
				"A": map[int]interface{}{
					1: map[int]interface{}{
						5: 123,
						6: map[string]interface{}{
							"A": "X",
							"B": "Y",
						},
					},
				},
			},
		},

		{
			name:    "A = (int)123",
			srcRows: "A:  123",
			want:    map[string]interface{}{"A": 123},
		},
		{
			name:    "A = (string)123",
			srcRows: "A: 123",
			want:    map[string]interface{}{"A": "123"},
		},
		{
			name:    "A = (string)123 and B = (int)456",
			srcRows: "A: 123~B:  456",
			want:    map[string]interface{}{"A": "123", "B": 456},
		},
		{
			name:    "A = (string)123 and B = (int)456",
			srcRows: "A~:B:  456",
			want:    map[string]interface{}{"A": map[string]interface{}{"B": 456}},
		},
		{
			name: "A = (string)123 and B = (int)456 (multirows)",
			srcRows: `
			A:
				:--:  123
				:--:  456
			`,
			want: map[string]interface{}{"A": map[int]interface{}{0: 123, 1: 456}},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := h.Decode(tc.srcRows, tc.layers)
			assert.Equal(t, tc.want, got)
		})
	}
}
