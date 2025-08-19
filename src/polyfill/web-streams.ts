import {
  ByteLengthQueuingStrategy,
  CountQueuingStrategy,
  ReadableByteStreamController,
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamBYOBRequest,
  ReadableStreamDefaultController,
  ReadableStreamDefaultReader,
  TransformStream,
  TransformStreamDefaultController,
  WritableStream,
  WritableStreamDefaultController,
  WritableStreamDefaultWriter,
} from 'web-streams-polyfill';
import type { checked } from '../ts.js';

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream as checked;
}

if (typeof globalThis.ReadableStreamBYOBReader === 'undefined') {
  globalThis.ReadableStreamBYOBReader = ReadableStreamBYOBReader as checked;
}

if (typeof globalThis.ReadableStreamBYOBRequest === 'undefined') {
  globalThis.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest as checked;
}

if (typeof globalThis.ReadableStreamDefaultController === 'undefined') {
  globalThis.ReadableStreamDefaultController =
    ReadableStreamDefaultController as checked;
}

if (typeof globalThis.ReadableStreamDefaultReader === 'undefined') {
  globalThis.ReadableStreamDefaultReader =
    ReadableStreamDefaultReader as checked;
}

if (typeof globalThis.ReadableByteStreamController === 'undefined') {
  globalThis.ReadableByteStreamController =
    ReadableByteStreamController as checked;
}

if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream as checked;
}

if (typeof globalThis.WritableStreamDefaultController === 'undefined') {
  globalThis.WritableStreamDefaultController =
    WritableStreamDefaultController as checked;
}

if (typeof globalThis.WritableStreamDefaultWriter === 'undefined') {
  globalThis.WritableStreamDefaultWriter =
    WritableStreamDefaultWriter as checked;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream as checked;
}

if (typeof globalThis.TransformStreamDefaultController === 'undefined') {
  globalThis.TransformStreamDefaultController =
    TransformStreamDefaultController as checked;
}

if (typeof globalThis.ByteLengthQueuingStrategy === 'undefined') {
  globalThis.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy as checked;
}

if (typeof globalThis.CountQueuingStrategy === 'undefined') {
  globalThis.CountQueuingStrategy = CountQueuingStrategy as checked;
}
