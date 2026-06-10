/**
 * LemonadeJS v6 — error codes
 *
 * Every error and warning carries a stable code (LJS-xxx) with a one-line
 * cause and a one-line fix, designed to be pattern-matched by tools and
 * agents. explain(code) returns the long-form documentation offline.
 */
/** Throw a LemonadeJS error with a stable code */
export declare const fail: (code: string, detail?: string) => never;
/** Print a development-mode warning with a stable code */
export declare const warn: (code: string, detail?: string) => void;
/** Long-form documentation for an error code, available offline */
export declare const explain: (code: string) => string;
