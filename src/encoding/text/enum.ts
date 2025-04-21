/**
 * 文本编码枚举（键值参考 [W3C Encoding Standard](https://encoding.spec.whatwg.org/) 但并不完全一致）
 */
export enum TextEncoding {
    Unknown = "unknown",
    Ascii = "ascii",
    Big5 = "big5",
    Euc_JP = "euc-jp",
    Euc_KR = "euc-kr",
    Gb18030 = "gb18030",
    Iso2022 = "iso-2022",
    Iso2022_CN = "iso-2022-cn",
    Iso2022_JP = "iso-2022-jp",
    Iso2022_KR = "iso-2022-kr",
    /**
     * 别名：`latin1`
     */
    Iso8859_1 = "iso8859-1",
    Iso8859_2 = "iso8859-2",
    Iso8859_5 = "iso8859-5",
    Iso8859_6 = "iso8859-6",
    Iso8859_7 = "iso8859-7",
    Iso8859_8 = "iso8859-8",
    Iso8859_9 = "iso8859-9",
    Koi8R = "koi8-r",
    Mbcs = "mbcs",
    Sbcs = "sbcs",
    Shift_JIS = "shift_jis",
    Utf16 = "utf-16",
    Utf16be = "utf-16be",
    Utf16le = "utf-16le",
    Utf32 = "utf-32",
    Utf32be = "utf-32be",
    Utf32le = "utf-32le",
    Utf8 = "utf-8",
    Windows1250 = "windows-1250",
    Windows1251 = "windows-1251",
    Windows1252 = "windows-1252",
    Windows1253 = "windows-1253",
    Windows1254 = "windows-1254",
    Windows1255 = "windows-1255",
    Windows1256 = "windows-1256",
}

/**
 * 支持编解码的文本编码格式
 */
export enum CodecableTextEncoding {
    Ascii = TextEncoding.Ascii,
    Utf8 = TextEncoding.Utf8,
    Utf16 = TextEncoding.Utf16,
    Utf16le = TextEncoding.Utf16le,
    Utf16be = TextEncoding.Utf16be,
    /**
     * 别名：`latin1`
     */
    Iso8859_1 = TextEncoding.Iso8859_1,
}
