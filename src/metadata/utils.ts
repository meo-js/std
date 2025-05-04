import { getSuperClass, type AbstractClass } from "../class.js";
import type { none } from "../ts.js";

/**
 * 元数据 `setter` 函数
 */
export type MetadataSetter<T> = (
    superValue: T | null,
    target: AbstractClass,
) => T;

/**
 * 已标准化的类
 */
const normalizedClasses = new WeakSet<AbstractClass>();

/**
 * 获取元数据
 *
 * 该方法会返回继承链上的数据。
 */
export function get<T>(target: AbstractClass, key: PropertyKey): T {
    const metadata = from(target);
    return metadata[key] as T;
}

/**
 * 获取自身元数据
 *
 * 该方法仅会返回本类的元数据，不会返回继承链上的数据。
 */
export function getFromSelf<T>(target: AbstractClass, key: PropertyKey): T {
    const metadata = from(target);
    if (Object.hasOwn(metadata, key)) {
        return metadata[key] as T;
    } else {
        return undefined!;
    }
}

/**
 * 设置元数据
 *
 * 该方法仅会设置本类的元数据，不会设置继承链上的数据。
 */
export function set(target: AbstractClass, key: PropertyKey, value: unknown) {
    const metadata = from(target);
    metadata[key] = value;
}

/**
 * 设置继承链上的元数据
 *
 * 该方法会从继承链根开始设置该 {@link key} 的元数据。
 */
export function setFromChain<T>(
    target: AbstractClass,
    key: PropertyKey,
    setter: MetadataSetter<T>,
) {
    const metadata = from(target);
    const parent = getSuperClass(target);
    const parentMetadata =
        parent == null ? null : setFromChain(parent, key, setter);

    const value = setter(parentMetadata, target);
    metadata[key] = value;
    return value;
}

/**
 * 删除元数据
 *
 * 该方法仅会删除本类的元数据，不会删除继承链上的数据。
 */
export function remove(target: AbstractClass, key: PropertyKey) {
    const metadata: DecoratorMetadataObject | undefined = from(target);
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
    delete metadata[key];
}

/**
 * 删除继承链上的元数据
 *
 * 该方法会删除自身和继承链上所有该 {@link key} 的元数据。
 */
export function removeFromChain(target: AbstractClass, key: PropertyKey) {
    const metadata = from(target);
    let current: DecoratorMetadataObject | none = metadata;
    while (current != null) {
        if (Object.hasOwn(current, key)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
            delete current[key];
        }
        current = Object.getPrototypeOf(current) as
            | DecoratorMetadataObject
            | none;
    }
}

/**
 * 元数据是否存在
 *
 * 该方法会检查继承链上的数据。
 */
export function has(target: AbstractClass, key: PropertyKey) {
    const metadata = from(target);
    return key in metadata;
}

/**
 * 自身元数据是否存在
 *
 * 该方法仅会检查本类的元数据，不会检查继承链上的数据。
 */
export function hasFromSelf(target: AbstractClass, key: PropertyKey) {
    const metadata = from(target);
    return Object.hasOwn(metadata, key);
}

/**
 * 返回元数据，不存在则从继承链根开始创建数据
 */
export function init<T>(
    target: AbstractClass,
    key: PropertyKey,
    initializer: MetadataSetter<T>,
): T {
    const metadata = from(target);

    if (Object.hasOwn(metadata, key)) {
        return metadata[key] as T;
    }

    const parent = getSuperClass(target);
    const parentMetadata =
        parent == null ? null : init(parent, key, initializer);

    const value = initializer(parentMetadata, target);
    metadata[key] = value;
    return value;
}

/**
 * @returns 返回按顺序遍历的迭代器，最后一个元素是根元数据
 */
export function* walkChain<T>(
    target: AbstractClass,
    key: PropertyKey,
): Generator<{ class: AbstractClass; metadata: T }, void, never> {
    let current: AbstractClass | undefined = target;
    let metadata: DecoratorMetadataObject | null = from(target);

    while (current != null && metadata != null) {
        yield {
            class: current,
            metadata: Object.hasOwn(metadata, key)
                ? (metadata[key] as T)
                : undefined!,
        };

        current = getSuperClass(current);
        metadata = Object.getPrototypeOf(
            metadata,
        ) as DecoratorMetadataObject | null;
    }
}

/**
 * @returns 返回按顺序排列的数组，最后一个元素是根元数据
 */
export function getChain<T>(
    target: AbstractClass,
    key: PropertyKey,
): { class: AbstractClass; metadata: T }[] {
    let current: AbstractClass | undefined = target;
    let metadata: DecoratorMetadataObject | null = from(target);

    const results: { class: AbstractClass; metadata: T }[] = [];

    while (current != null && metadata != null) {
        results.push({
            class: current,
            metadata: Object.hasOwn(metadata, key)
                ? (metadata[key] as T)
                : undefined!,
        });

        current = getSuperClass(current);
        metadata = Object.getPrototypeOf(
            metadata,
        ) as DecoratorMetadataObject | null;
    }

    return results;
}

/**
 * 确保类元数据具有继承链（不存在则创建）并返回元数据
 */
export function from<T extends DecoratorMetadata>(target: AbstractClass): T {
    if (normalizedClasses.has(target)) {
        return target[Symbol.metadata] as T;
    }

    const parent = getSuperClass(target);
    const parentMetadata = parent == null ? null : from(parent);
    const desc = Object.getOwnPropertyDescriptor(target, Symbol.metadata);

    if (desc == null) {
        // 若不存在元数据则创建，并确保父元数据已标准化
        const metadata = Object.create(parentMetadata) as DecoratorMetadata;
        Object.defineProperty(target, Symbol.metadata, {
            configurable: true,
            writable: true,
            enumerable: false,
            value: metadata,
        });
        normalizedClasses.add(target);
        return metadata as T;
    } else {
        const metadata = desc.value as DecoratorMetadata;
        // 原型不是父元数据则设置
        if (Object.getPrototypeOf(metadata) !== parentMetadata) {
            Object.setPrototypeOf(metadata, parentMetadata);
        }
        normalizedClasses.add(target);
        return metadata as T;
    }
}
