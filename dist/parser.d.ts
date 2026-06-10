/**
 * LemonadeJS v6 — template parser
 *
 * Parses the static strings of a tagged template into a JSON tree (Template).
 * Runs ONCE per call site: the TemplateStringsArray identity is the cache key
 * (see html in index.ts). Slots are recorded by position; values are never
 * seen here.
 *
 * Slot positions supported:
 *   text:       <div>${...}</div>          → { type: '#slot', slot: i }
 *   attribute:  value="${...}" / a="x ${y}" → prop parts
 *   component:  <${Card} prop="1">...</${Card}>  → { type: { slot: i } }
 */
import type { Template } from './types';
export declare const parse: (strings: readonly string[]) => Template;
