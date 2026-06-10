/**
 * LemonadeJS v6 — error codes
 *
 * Every error and warning carries a stable code (LJS-xxx) with a one-line
 * cause and a one-line fix, designed to be pattern-matched by tools and
 * agents. explain(code) returns the long-form documentation offline.
 */

import { DEV } from './env';

const MESSAGES: Record<string, string> = {
    'LJS-001': 'Component is not a function',
    'LJS-002': 'Component must return a template created with html`...`',
    'LJS-003': 'mount() requires a DOM element as root',
    'LJS-101': 'Unexpected closing tag — check tag nesting',
    'LJS-102': 'Unclosed tag at the end of the template',
    'LJS-104': 'Unknown component — register it: setComponents({ Card }), or embed by value: <${Card} />',
    'LJS-105': 'Expression ${...} is not allowed in this position',
    'LJS-201': 'In-place mutation is silent — call state.touch() after mutating, or assign a new value',
    'LJS-202': 'Slot holds a snapshot — wrap dynamic expressions: ${() => ...}',
    'LJS-203': 'Update loop detected — a state change keeps triggering itself',
    'LJS-301': 'Event attributes require a function: onclick="${() => ...}"',
    'LJS-302': 'bind requires a state: bind="${state}"',
    'LJS-303': 'bind works on <input>, <textarea> and <select> — on components it is a prop',
    'LJS-304': 'bind owns the element value — remove the explicit value/checked attribute',
    'LJS-305': 'Event and callback names are lowercase: onclick, onchange, onsave',
    'LJS-401': 'Prop does not match its contract',
};

const EXPLAIN: Record<string, string> = {
    'LJS-001':
        'The value used as a component is not a function. Components are plain functions: ' +
        'const Card: Component = (props, { state }) => html`<div>...</div>`. ' +
        'When embedding, pass the function itself: <${Card} title="x" />.',
    'LJS-002':
        'A component must return the result of the html tag. ' +
        'Correct: return html`<div>${count}</div>`. ' +
        'Returning strings, DOM nodes or nothing is not supported.',
    'LJS-003':
        'mount(Component, root) expects root to be an existing DOM element, e.g. document.getElementById("app").',
    'LJS-101':
        'A closing tag was found that does not match the currently open tag. ' +
        'Check the nesting of your template. Void elements (br, img, input...) must not be closed.',
    'LJS-102':
        'The template ended while a tag was still open. Every opened tag must be closed: <div>...</div>, ' +
        'or self-closed: <Component />.',
    'LJS-104':
        'Tags starting with an uppercase letter are components. Either register the function once — ' +
        'setComponents({ Card }) — and use <Card /> anywhere (names are case-sensitive and must match ' +
        'exactly), or embed it by value with no registration: <${Card} />. ' +
        'A typo in a registered name raises this error at mount time.',
    'LJS-105':
        'Expressions can appear as text content, as a full attribute value, inside a quoted attribute value, ' +
        'or as a component tag: <${Card}>. They cannot be used as attribute names or partial tag names.',
    'LJS-201':
        'State contents are NOT immutable (this is not React): mutating in place is allowed and free — ' +
        'rows.value[i].total = 9 — but it does not notify by itself. Call rows.touch() after mutating to ' +
        'run updates: no copies, no proxies, DOM writes are delta-only. For bulk operations wrap the work ' +
        'in batch(() => {...}) so thousands of changes notify once. For small data, assignment also works: ' +
        'state.value = [...state.value, x]. The footgun: mutate without touch() and nothing updates.',
    'LJS-202':
        'A template slot received a plain value (string/number/boolean) while states were being read. ' +
        'Plain values are one-time snapshots. If the slot should update when states change, wrap it: ' +
        '${() => valid.value && html`...`}. If the snapshot is intentional, ignore this warning.',
    'LJS-203':
        'A state assignment inside a reactive expression triggered itself recursively more than 100 times. ' +
        'Do not assign to states inside template expressions; assign from event handlers or callbacks.',
    'LJS-301':
        'Attributes starting with "on" are events and must receive a function: onclick="${() => count.value++}". ' +
        'String handlers are not supported (CSP-safe by design).',
    'LJS-302':
        'The bind directive needs the state object itself: bind="${name}" (not bind="name", which is a string, ' +
        'and not bind="${name.value}", which is a one-time snapshot). Create it with const name = state("").',
    'LJS-303':
        'On native elements, bind is engine sugar and only <input>, <textarea> and <select> have a defined wiring. ' +
        'On components, bind is a plain prop: implement it with the bind() tool — ' +
        'const value = bind(props, fallback) — and pass <${Comp} bind="${state}" />.',
    'LJS-304':
        'An element has both bind and an explicit value/checked attribute. bind drives that property in both ' +
        'directions, so the explicit attribute fights it. Remove value/checked and set the state instead.',
    'LJS-305':
        'One rule, no exceptions: every event and callback name is lowercase, HTML-style — onclick, oninput, ' +
        'onchange, onsave, onitemclick — exactly like the platform names onmousedown or onbeforeunload. ' +
        'On native elements other casings still attach (the event name is normalized) but warn; on components, ' +
        'props are case-sensitive JavaScript keys, so onChange would be silently ignored by a component reading ' +
        'onchange. Declare and pass component callbacks in lowercase.',
    'LJS-401':
        'A published component received a prop that violates its contract: wrong type, a non-function for a ' +
        'declared event, or a contract key that cannot work (prop names must be lowercase because they become ' +
        'HTML attributes). Check describe(Component) for the expected interface. Attribute strings are coerced ' +
        'to the declared type automatically ("5" → 5 for numbers, presence semantics for booleans).',
};

const format = function (code: string, detail?: string): string {
    const message = MESSAGES[code] || 'Unknown error';
    return code + ': ' + message + (detail ? ' — ' + detail : '');
};

/** Throw a LemonadeJS error with a stable code */
export const fail = function (code: string, detail?: string): never {
    throw new Error(format(code, detail));
};

/** Print a development-mode warning with a stable code */
export const warn = function (code: string, detail?: string): void {
    if (DEV && typeof console !== 'undefined') {
        console.warn(format(code, detail));
    }
};

/** Long-form documentation for an error code, available offline */
export const explain = function (code: string): string {
    return EXPLAIN[code] || 'Unknown code: ' + code;
};
