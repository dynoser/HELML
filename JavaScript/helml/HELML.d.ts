export type HELMLelemIn = string | number | null | boolean | bigint | undefined;
export type HELMLelemOut = string | number | null | boolean | undefined;
export type HELMLobj = {
    [key: string]: HELMLelemOut | HELMLelemOut[] | HELMLobj;
};
export default class HELML {
    static ENABLE_BONES: boolean;
    static ENABLE_SPC_IDENT: number;
    static ENABLE_KEY_UPLINES: boolean;
    static ENABLE_HASHSYMBOLS: boolean;
    static ADD_PREFIX: boolean;
    static ADD_POSTFIX: boolean;
    static ENABLE_DBL_KEY_ARR: boolean;
    static CUSTOM_FORMAT_DECODER: ((value: string, spc_ch: string) => any) | null;
    static CUSTOM_VALUE_DECODER: ((value: string, spc_ch: string) => any) | null;
    static CUSTOM_VALUE_ENCODER: ((value: string, spc_ch: string) => any) | null;
    static EOL: string;
    static SPEC_TYPE_VALUES: Record<string, any>;
    static URL_SPC: string;
    static URL_LVL: string;
    /**
     * Encodes the specified array into a HELM.
     * @param {any} inArr - The array to encode.
     * @param {number} [oneLineMode=0] - The encoding mode to use:
     *     - 0 - regular multi-line encoding
     *     - 1 - URL encoding with . and = separators
     *     - 2 - single-line encoding with trimmed strings and removed empty and comment lines
     * @returns {string} The encoded HELM-like string.
     */
    static encode(inArr: any, oneLineMode?: number): string;
    static _encode(inArr: {
        [x: string]: any;
    }, outArr: {
        push: any;
    }, level?: number, lvlCh?: string, spcCh?: string, isList?: boolean): void;
    static decode(srcRows: string | string[], getLayers?: number | string | (string | number)[]): HELMLobj;
    static _decode(strArr: string[], layersList: Set<string>, lvlCh: string, spcCh: string): HELMLobj;
    static valueEncoder(value: HELMLelemIn, spcCh?: string): string;
    static valueDecoder(encodedValue: string, spcCh?: string): HELMLelemOut;
    static base64Uencode(str: string, urlMode?: boolean): string;
    static base64Udecode(str: string): string | null;
    static iterablize<T>(arr: T[] | Iterable<T> | Map<any, T> | Set<T>): T[] | Iterable<T>;
    static stripcslashes(str: string): string;
    static hexDecode(str: string): string | null;
}
