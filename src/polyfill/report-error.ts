// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
globalThis.reportError ??= function reportError(e: unknown) {
  queueMicrotask(() => {
    throw e;
  });
};
