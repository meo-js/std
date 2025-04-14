import { Endian } from "./shared.js";

export function decode(input: BufferSource): string {
    return "";
}

export function encode(input: string): Uint8Array {
    // TODO
    return new Uint8Array();
}

export function sniff(input: BufferSource): Endian {
    // TODO
    return Endian.Little;
}
