/**
 * @module
 *
 * @internal
 */
import { Pipe } from "../../pipe.js";
import { flatCharCodes } from "../../pipe/string.js";
import { toUint8ArrayWithCount } from "../../pipe/typed-array.js";
import { asUint8Array } from "../../typed-array.js";
import { catchError } from "../error.js";

/**
 * 通用的解码到缓冲区函数
 *
 * @internal
 */
export function _decodeInto(
    text: string,
    out: BufferSource,
    decodePipe: Pipe<number, number, void>,
    sufficientSize: number,
    tempSize: number,
): { read: number; written: number } {
    const buffer = asUint8Array(out);

    let read = 0;
    let written = 0;

    if (buffer.length >= sufficientSize) {
        read = text.length;
        written = Pipe.run(
            text,
            flatCharCodes(),
            catchError(),
            decodePipe,
            toUint8ArrayWithCount(buffer),
        ).written;
    } else {
        const temp = new Uint8Array(tempSize);
        let uread = 0;
        let uwritten = 0;
        const len = text.length;
        const decoder = catchError<number>()
            .pipe(decodePipe)
            .pipe(input => {
                temp[uwritten++] = input;
            });

        while (read < len) {
            const code = text.charCodeAt(read);

            decoder.push(code);
            uread++;
            read++;

            // 无写入则说明该单元字节不完整，继续处理直到有写入
            if (uwritten === 0) {
                continue;
            }

            if (buffer.length - written < uwritten) {
                // 剩余空间不足
                read -= uread;
                return {
                    read,
                    written,
                };
            }

            for (let j = 0; j < uwritten; j++) {
                buffer[written++] = temp[j];
            }

            uread = 0;
            uwritten = 0;
        }

        // 处理可能剩余的字节
        decoder.flush();

        if (uwritten > 0) {
            if (buffer.length - written >= uwritten) {
                for (let j = 0; j < uwritten; j++) {
                    buffer[written++] = temp[j];
                }
            } else {
                // 剩余空间不足
                read -= uread;
            }
        }
    }

    return {
        read,
        written,
    };
}
