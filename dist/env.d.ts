/**
 * LemonadeJS v6 — build-time dev flag
 *
 * DEV is a constant, not a runtime switch: production builds define
 * __DEV__ = false and every dev-only branch (warnings, casing checks,
 * props freezing) is eliminated by the bundler — production pays zero.
 *
 * Which mode you get is decided by the artifact you load:
 *   dist/lemonade.dev.js / lemonade.mjs    dev (warnings on)
 *   dist/lemonade.min.js / *.prod.*        production (stripped)
 * Bundlers pick automatically via the package "development" condition.
 */
export declare const DEV: boolean;
