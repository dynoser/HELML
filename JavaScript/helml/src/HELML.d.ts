export default class HELML {
    static ENABLE_BONES: boolean;
    static ENABLE_SPC_IDENT: boolean;
    static ENABLE_KEY_UPLINES: boolean;
    static ENABLE_HASHSYMBOLS: boolean;
    static CUSTOM_FORMAT_DECODER: ((value: string, spc_ch: string) => any) | null;
    static CUSTOM_VALUE_DECODER: ((value: string, spc_ch: string) => any) | null;
    static CUSTOM_VALUE_ENCODER: ((value: string, spc_ch: string) => any) | null;
    static SPEC_TYPE_VALUES: Record<string, any>;
    static encode(arr: any, url_mode?: boolean): string;
    static _encode(arr: {
        [x: string]: any;
    }, results_arr: {
        push?: any;
    }, level?: number, lvl_ch?: string, spc_ch?: string, is_list?: boolean): void;
    static decode(src_rows: string, layers_list?: (string | number)[]): {
        [key: string]: any;
    };
    static valueEncoder(value: string | number | null | boolean | number | bigint | undefined, spc_ch?: string): string;
    static valueDecoder(encodedValue: string, spc_ch?: string): string | number | null | boolean | undefined;
    static base64Uencode(str: string): string;
    static base64Udecode(str: string): string | null;
    static iterablize<T>(arr: T[] | Iterable<T> | Map<any, T> | Set<T>): T[] | Iterable<T>;
    static stripcslashes(str: string): string;
}
