declare global {
    function btoa(input: string): string;
    function atob(input: string): string;
}
export default class HELML {
    static ENABLE_BONES: boolean;
    static ENABLE_SPC_IDENT: number;
    static ENABLE_KEY_UPLINES: boolean;
    static ENABLE_HASHSYMBOLS: boolean;
    static CUSTOM_FORMAT_DECODER: ((value: string, spc_ch: string) => any) | null;
    static CUSTOM_VALUE_DECODER: ((value: string, spc_ch: string) => any) | null;
    static CUSTOM_VALUE_ENCODER: ((value: string, spc_ch: string) => any) | null;
    static SPEC_TYPE_VALUES: Record<string, any>;
    /**
     * Encodes the specified array into a HELM.
     * @param {any} arr - The array to encode.
     * @param {number} [one_line_mode=0] - The encoding mode to use:
     *     - 0 - regular multi-line encoding
     *     - 1 - URL encoding with dot and underscore separators
     *     - 2 - single-line encoding with trimmed strings and removed empty and comment lines
     * @returns {string} The encoded HELM-like string.
     */
    static encode(arr: any, one_line_mode?: number): string;
    static _encode(arr: {
        [x: string]: any;
    }, results_arr: {
        push: any;
    }, level?: number, lvl_ch?: string, spc_ch?: string, is_list?: boolean): void;
    static decode(src_rows: string, get_layers?: number | string | (string | number)[]): {
        [key: string]: any;
    };
    static _decode(str_arr: string[], layers_list: Set<string>, lvl_ch: string, spc_ch: string): {
        [key: string]: any;
    };
    static valueEncoder(value: string | number | null | boolean | number | bigint | undefined, spc_ch?: string): string;
    static valueDecoder(encodedValue: string, spc_ch?: string): string | number | null | boolean | undefined;
    static base64Uencode(str: string): string;
    static base64Udecode(str: string): string | null;
    static iterablize<T>(arr: T[] | Iterable<T> | Map<any, T> | Set<T>): T[] | Iterable<T>;
    static stripcslashes(str: string): string;
}
