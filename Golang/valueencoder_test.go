package gohelml_test

import (
	"reflect"
	"testing"

	"github.com/dynoser/gohelml"
)

func TestValueEncoder(t *testing.T) {
	h := &gohelml.HELML{}

	testCases := []struct {
		name    string
		srcRows string
		spcCh   string
		want    interface{}
	}{

		{
			name:    "Undefined",
			srcRows: "  U",
			spcCh:   " ",
			want:    (*interface{})(nil),
		},
		{
			name:    "NULL",
			srcRows: "  N",
			spcCh:   " ",
			want:    (nil),
		},
		{
			name:    "Base64url decode",
			srcRows: "-dGUKc3Q=",
			spcCh:   " ",
			want:    "te\nst",
		},
		{
			name:    "True value",
			srcRows: "  T",
			spcCh:   " ",
			want:    true,
		},
		{
			name:    "False value",
			srcRows: "  F",
			spcCh:   " ",
			want:    false,
		},
		{
			name:    "Number",
			srcRows: "  123.45",
			spcCh:   " ",
			want:    float64(123.45),
		},
		{
			name:    "Number",
			srcRows: "  -123.45",
			spcCh:   " ",
			want:    -float64(123.45),
		},
		{
			name:    "Number",
			srcRows: "  123",
			spcCh:   " ",
			want:    int(123),
		},
		{
			name:    "Number",
			srcRows: "  -123",
			spcCh:   " ",
			want:    -int(123),
		},
		{
			name:    "Single value",
			srcRows: " text",
			spcCh:   " ",
			want:    "text",
		},
		// {
		// 	name:    "single quoted value",
		// 	srcRows: "'text1 text2 text3'",
		// 	spcCh:   " ",
		// 	want:    "text1 text2 text3",
		// },
		// {
		// 	name:    "double quoted newline inside value",
		// 	srcRows: "\"text3\\n text2 text1\"",
		// 	spcCh:   " ",
		// 	want:    "text3\n text2 text1",
		// },
		// {
		// 	name:    "Base64url decode",
		// 	srcRows: "-dGVzdA",
		// 	spcCh:   " ",
		// 	want:    "test",
		// },
		// {
		// 	name:    "Base64url decode==",
		// 	srcRows: "-dGVzdA==",
		// 	spcCh:   " ",
		// 	want:    "test",
		// },
		// {
		// 	name:    "Empty line in base64url",
		// 	srcRows: "-",
		// 	spcCh:   " ",
		// 	want:    "",
		// },
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, _ := h.ValueEncoder(tc.want, tc.spcCh)
			if !reflect.DeepEqual(got, tc.srcRows) {
				t.Errorf("ValueDecoder(%q, %q) = %v, want %v", tc.srcRows, tc.spcCh, got, tc.want)
			}
		})
	}
}
