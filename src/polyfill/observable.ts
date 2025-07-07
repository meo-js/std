/**
 * @public
 *
 * @module
 */
import { apply, isSupported, type Observable } from "observable-polyfill/fn";

if (!isSupported()) {
    apply();
}

declare global {
    interface EventTarget {
        when<T extends keyof HTMLElementEventMap>(
            type: T,
            options?: ObservableEventListenerOptions,
        ): Observable<HTMLElementEventMap[T]>;
        when<T extends keyof WindowEventMap>(
            type: T,
            options?: ObservableEventListenerOptions,
        ): Observable<WindowEventMap[T]>;
        when<T extends keyof DocumentEventMap>(
            type: T,
            options?: ObservableEventListenerOptions,
        ): Observable<DocumentEventMap[T]>;
        when(
            type: string,
            options?: ObservableEventListenerOptions,
        ): Observable<Event>;
    }
    interface Document {
        when<T extends keyof HTMLElementEventMap>(
            event: T,
            options?: ObservableEventListenerOptions,
        ): Observable<HTMLElementEventMap[T]>;
        when(
            type: string,
            options?: ObservableEventListenerOptions,
        ): Observable<Event>;
    }
    interface Element {
        when<T extends keyof HTMLElementEventMap>(
            event: T,
            options?: ObservableEventListenerOptions,
        ): Observable<HTMLElementEventMap[T]>;
        when(
            type: string,
            options?: ObservableEventListenerOptions,
        ): Observable<Event>;
    }
    interface Window {
        when<T extends keyof HTMLElementEventMap>(
            event: T,
            options?: ObservableEventListenerOptions,
        ): Observable<HTMLElementEventMap[T]>;
        when(
            type: string,
            options?: ObservableEventListenerOptions,
        ): Observable<Event>;
    }
}

export {
    Observable,
    type CatchCallback,
    type Mapper,
    type ObservableEventListenerOptions,
    type ObservableInspector,
    type ObservableInspectorAbortHandler,
    type ObservableInspectorUnion,
    type ObservableSubscriptionCallback,
    type ObserverUnion,
    type Predicate,
    type Reducer,
    type SubscribeCallback,
    type SubscribeOptions,
    type Subscriber,
    type SubscriptionObserver,
    type Visitor,
} from "observable-polyfill/fn";
