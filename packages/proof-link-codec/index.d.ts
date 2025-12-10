export type CodecOptions = {
  encrypt?: (bytes: Uint8Array) => Uint8Array;
  decrypt?: (bytes: Uint8Array) => Uint8Array;
};

export declare const encode: <T>(payload: T, options?: Pick<CodecOptions, "encrypt">) => string;
export declare const decode: <T>(value: string, options?: Pick<CodecOptions, "decrypt">) => T;
export declare const strip0x: (hex: string) => string;
export declare const add0x: (hex: string) => string;
