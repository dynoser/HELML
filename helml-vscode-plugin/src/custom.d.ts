export type fakeWindow = {
    btoa(str: string): string;
    atob(str: string): string;
}
declare global {
    class TextEncoder {
      constructor(encoding?: string);
      encode(input?: string): Uint8Array;
    }
    class TextDecoder {
      constructor(encoding?: string);
      decode(input?: Uint8Array, options?: { stream?: boolean }): string;
    }
    function btoa(input: string): string;
    function atob(input: string): string;
}
