/* eslint-disable @typescript-eslint/switch-exhaustiveness-check -- upload. */
// TODO 正在实验实现一个 JavaScript 枚举类型以代替 TypeScript 枚举
// 参考：https://2ality.com/2020/01/enum-pattern.html
// 参考：https://github.com/rauschma/enumify
// 除了以上提到的 TypeScript 枚举的弊病，看是否能支持可扩展性。
// 看能否支持像 Rust 那样 ADT。
// 使用枚举实现 Result？

const Color = {
    BLACK: "#000000" as Color,
    WHITE: "#FFFFFF" as Color,
    RED: "#FF0000" as Color,
} as const;
const brand = Symbol("brand");
const ColorSymbol = Symbol("Color");
type Color = string & {
    [brand]: Record<typeof ColorSymbol, true>;
};

type ColorUnion = "black" | "white";
function draw(color: Color) {
    switch (color) {
        case Color.BLACK:
            break;
        case Color.WHITE:
            break;
        case Color.RED:
            break;
    }
    console.log(color);
}

function draw2(color: typeof Color.BLACK) {
    switch (color) {
        case Color.BLACK:
            break;
        case Color.WHITE:
            break;
        case Color.RED:
            break;
    }
    console.log(color);
}

draw(Color.BLACK);
