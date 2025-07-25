import { utf8 } from "../../encoding/text.js";
import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const INITIAL_HASH = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
]);

/**
 * SHA-256 cryptographic hash function.
 *
 * @param input String or byte data, if string is passed it will be encoded as UTF-8 using {@link utf8.encode} with default options.
 * @returns Return an 8-element Uint32Array representing the SHA-256 hash.
 */
export function sha256(input: string | BufferSource): Uint32Array {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const paddedData = padMessage(data);
    const hash = new Uint32Array(INITIAL_HASH);

    for (let i = 0; i < paddedData.length; i += 64) {
        processBlock(paddedData.subarray(i, i + 64), hash);
    }

    return hash;
}

/**
 * Create a pipe for computing SHA-256 hash.
 *
 * @returns SHA-256 hash pipe.
 */
export function sha256Pipe(): Pipe<number, Uint32Array, Uint32Array> {
    return Pipe.create(new Sha256Pipe());
}

function rotr(n: number, x: number): number {
    return (x >>> n) | (x << (32 - n));
}

function ch(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
}

function maj(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0(x: number): number {
    return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
}

function sigma1(x: number): number {
    return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
}

function smallSigma0(x: number): number {
    return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
}

function smallSigma1(x: number): number {
    return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
}

function processBlock(block: Uint8Array, hash: Uint32Array): void {
    const w = new Uint32Array(64);

    for (let i = 0; i < 16; i++) {
        w[i] =
            (block[i * 4] << 24)
            | (block[i * 4 + 1] << 16)
            | (block[i * 4 + 2] << 8)
            | block[i * 4 + 3];
    }

    for (let i = 16; i < 64; i++) {
        w[i] =
            (smallSigma1(w[i - 2])
                + w[i - 7]
                + smallSigma0(w[i - 15])
                + w[i - 16])
            >>> 0;
    }

    let a = hash[0],
        b = hash[1],
        c = hash[2],
        d = hash[3];
    let e = hash[4],
        f = hash[5],
        g = hash[6],
        h = hash[7];

    for (let i = 0; i < 64; i++) {
        const t1 = (h + sigma1(e) + ch(e, f, g) + K[i] + w[i]) >>> 0;
        const t2 = (sigma0(a) + maj(a, b, c)) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
}

function padMessage(data: Uint8Array): Uint8Array {
    const originalLength = data.length;
    const bitLength = originalLength * 8;

    // Calculate padded length (must be multiple of 512 bits)
    const paddingLength = ((originalLength + 9 + 63) & ~63) - originalLength;
    const paddedData = new Uint8Array(originalLength + paddingLength);

    paddedData.set(data);

    paddedData[originalLength] = 0x80;

    const lengthOffset = paddedData.length - 8;
    for (let i = 0; i < 8; i++) {
        paddedData[lengthOffset + i] = (bitLength >>> (8 * (7 - i))) & 0xff;
    }

    return paddedData;
}

class Sha256Pipe implements IPipe<number, Uint32Array, Uint32Array> {
    private hash = new Uint32Array(INITIAL_HASH);
    private buffer = new Uint8Array(64);
    private bufferSize = 0;
    private len = 0;

    transform(input: number): boolean {
        this.buffer[this.bufferSize] = input & 0xff;
        this.bufferSize++;
        this.len++;

        if (this.bufferSize === 64) {
            processBlock(this.buffer, this.hash);
            this.bufferSize = 0;
        }

        return true;
    }

    flush(next: Next<Uint32Array>): Uint32Array {
        const result = this.finalize();
        this.reset();
        next(result);
        return result;
    }

    private finalize(): Uint32Array {
        const bitLength = this.len * 8;

        // Add padding
        this.buffer[this.bufferSize] = 0x80;
        this.bufferSize++;

        // If there's not enough space for the length (8 bytes), process current block and start new one
        if (this.bufferSize > 56) {
            // Fill remaining space with zeros
            this.buffer.fill(0, this.bufferSize);
            processBlock(this.buffer, this.hash);
            this.buffer.fill(0);
            this.bufferSize = 0;
        } else {
            // Fill with zeros up to length field
            this.buffer.fill(0, this.bufferSize, 56);
        }

        // Add length in bits as big-endian 64-bit integer
        for (let i = 0; i < 8; i++) {
            this.buffer[56 + i] = (bitLength >>> (8 * (7 - i))) & 0xff;
        }

        processBlock(this.buffer, this.hash);

        return this.hash;
    }

    catch(): void {
        this.reset();
    }

    private reset(): void {
        this.hash.set(INITIAL_HASH);
        this.bufferSize = 0;
        this.len = 0;
    }
}
