/**
 * Adversarial suite: edge cases designed to break the engine.
 * Covers state (+ onchange callbacks), mount/unmount, onMount/onUnmount
 * (v5: onload), all template syntax, branches, and component boundaries.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, mount, type Component, type State } from '../src/index';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('State edge cases', () => {
    it('assigning the same value triggers nothing (Object.is)', () => {
        let runs = 0;
        let ref!: State<number>;
        const C: Component = (p, { state }) => {
            const n = state(1);
            ref = n;
            return render`<div>${() => (runs++, n.value)}</div>`;
        };
        handle = t(C);
        const initial = runs;
        ref.value = 1;
        expect(runs).toBe(initial);
    });

    it('NaN to NaN does not loop or notify', () => {
        const calls: unknown[] = [];
        let ref!: State<number>;
        const C: Component = (p, { state }) => {
            const n = state(NaN, (v) => calls.push(v));
            ref = n;
            return render`<div>${n}</div>`;
        };
        handle = t(C);
        ref.value = NaN;
        expect(calls).toHaveLength(0);
    });

    it('renders 0 and empty string correctly (0 is content, "" is nothing)', () => {
        const C: Component = () => render`<div><span>${0}</span><b>${''}</b></div>`;
        handle = t(C);
        expect(handle.query('span')!.textContent).toBe('0');
        expect(handle.query('b')!.textContent).toBe('');
    });

    it('state transitioning through null and undefined renders nothing, then content', () => {
        let ref!: State<string | null | undefined>;
        const C: Component = (p, { state }) => {
            const s = state<string | null | undefined>(null);
            ref = s;
            return render`<div>${s}</div>`;
        };
        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('');
        ref.value = undefined;
        expect(handle.query('div')!.textContent).toBe('');
        ref.value = 'now';
        expect(handle.query('div')!.textContent).toBe('now');
        ref.value = null;
        expect(handle.query('div')!.textContent).toBe('');
    });

    it('one expression reading two states re-runs when either changes', () => {
        let a!: State<number>, b!: State<number>;
        const C: Component = (p, { state }) => {
            const x = state(1);
            const y = state(10);
            a = x;
            b = y;
            return render`<div>${() => x.value + y.value}</div>`;
        };
        handle = t(C);
        expect(handle.text()).toBe('11');
        a.value = 2;
        expect(handle.text()).toBe('12');
        b.value = 20;
        expect(handle.text()).toBe('22');
    });

    it('one state read by many slots updates all of them', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const mode = state('a');
            ref = mode;
            return render`<div class="${mode}" data-m="${mode}"><i>${mode}</i><b>${() => mode.value.toUpperCase()}</b></div>`;
        };
        handle = t(C);
        ref.value = 'b';
        const div = handle.query('div')!;
        expect(div.className).toBe('b');
        expect(div.getAttribute('data-m')).toBe('b');
        expect(handle.query('i')!.textContent).toBe('b');
        expect(handle.query('b')!.textContent).toBe('B');
    });

    it('conditional dependencies re-track: states read only in one ternary arm still update', () => {
        let flag!: State<boolean>, a!: State<string>, b!: State<string>;
        const C: Component = (p, { state }) => {
            const f = state(true);
            const x = state('A');
            const y = state('B');
            flag = f;
            a = x;
            b = y;
            return render`<div>${() => (f.value ? x.value : y.value)}</div>`;
        };
        handle = t(C);
        expect(handle.text()).toBe('A');
        flag.value = false;
        expect(handle.text()).toBe('B');
        // x is no longer a dependency; y now is
        b.value = 'B2';
        expect(handle.text()).toBe('B2');
        a.value = 'A2';
        expect(handle.text()).toBe('B2');
        flag.value = true;
        expect(handle.text()).toBe('A2');
    });

    it('onchange callback fires after the DOM is already updated', () => {
        let seen = '';
        let ref!: State<number>;
        const C: Component = (p, { state }) => {
            const n = state(0, () => {
                seen = handle!.query('p')!.textContent || '';
            });
            ref = n;
            return render`<div><p>${n}</p></div>`;
        };
        handle = t(C);
        ref.value = 7;
        expect(seen).toBe('7');
    });

    it('onchange chains: a callback assigning another state propagates', () => {
        let a!: State<number>;
        const C: Component = (p, { state }) => {
            const double = state(0);
            const n = state(0, (v) => (double.value = v * 2));
            a = n;
            return render`<div>${n}:${double}</div>`;
        };
        handle = t(C);
        a.value = 4;
        expect(handle.text()).toBe('4:8');
    });

    it('a state never used in the template can still be assigned', () => {
        let ref!: State<number>;
        const C: Component = (p, { state }) => {
            const unused = state(0);
            ref = unused;
            return render`<div>ok</div>`;
        };
        handle = t(C);
        expect(() => (ref.value = 99)).not.toThrow();
        expect(handle.text()).toBe('ok');
    });

    it('assigning state after unmount does not throw or touch the DOM', () => {
        let ref!: State<number>;
        const C: Component = (p, { state }) => {
            const n = state(1);
            ref = n;
            return render`<div>${n}</div>`;
        };
        const local = t(C);
        local.unmount();
        expect(() => (ref.value = 2)).not.toThrow();
    });

    it('two instances of the same component have isolated states', () => {
        const Counter: Component = (p, { state }) => {
            const n = state(0);
            return render`<div class="c"><span>${n}</span><button onclick="${() => n.value++}">+</button></div>`;
        };
        const App: Component = () => render`<main><${Counter} /><${Counter} /></main>`;
        handle = t(App);
        handle.queryAll('button')[0].click();
        handle.queryAll('button')[0].click();
        const spans = handle.queryAll('span').map((s) => s.textContent);
        expect(spans).toEqual(['2', '0']);
    });

    it('assigning the same array reference is a no-op; a new array updates', () => {
        let ref!: State<string[]>;
        let runs = 0;
        const C: Component = (p, { state }) => {
            const items = state(['a']);
            ref = items;
            return render`<ul>${() => (runs++, items.value.map((x) => render`<li>${x}</li>`))}</ul>`;
        };
        handle = t(C);
        const before = runs;
        ref.value = ref.value; // same reference
        expect(runs).toBe(before);
        ref.value = [...ref.value, 'b'];
        expect(handle.queryAll('li')).toHaveLength(2);
    });

    it('a state passed through two component levels stays live', () => {
        let ref!: State<number>;
        const Leaf: Component<{ total?: State<number> }> = (props) => render`<em>${props.total}</em>`;
        const Mid: Component<{ total?: State<number> }> = (props) =>
            render`<section><${Leaf} total="${props.total}" /></section>`;
        const App: Component = (p, { state }) => {
            const n = state(3);
            ref = n;
            return render`<div><${Mid} total="${n}" /></div>`;
        };
        handle = t(App);
        expect(handle.query('em')!.textContent).toBe('3');
        ref.value = 30;
        expect(handle.query('em')!.textContent).toBe('30');
    });

    it('rapid sequential updates settle on the final value', () => {
        let ref!: State<number>;
        const C: Component = (p, { state }) => {
            const n = state(0);
            ref = n;
            return render`<div>${n}</div>`;
        };
        handle = t(C);
        for (let i = 1; i <= 100; i++) {
            ref.value = i;
        }
        expect(handle.text()).toBe('100');
    });
});

describe('Template and parser edge cases', () => {
    it('renders a text-only template', () => {
        const C: Component = () => render`just text`;
        handle = t(C);
        expect(handle.text()).toBe('just text');
    });

    it('renders an empty template without crashing', () => {
        const C: Component = () => render``;
        handle = t(C);
        expect(handle.text()).toBe('');
    });

    it('supports multi-root templates and removes all roots on unmount', () => {
        const C: Component = () => render`<p>a</p><p>b</p>`;
        const local = t(C);
        expect(local.queryAll('p').map((p) => p.textContent)).toEqual(['a', 'b']);
        local.unmount();
        expect(local.root.childNodes).toHaveLength(0);
    });

    it('handles slots at the start and end of the template', () => {
        const C: Component = () => render`${'start'}<b>mid</b>${'end'}`;
        handle = t(C);
        expect(handle.text()).toBe('startmidend');
    });

    it('handles adjacent slots independently', () => {
        let a!: State<string>, b!: State<string>;
        const C: Component = (p, { state }) => {
            const x = state('1');
            const y = state('2');
            a = x;
            b = y;
            return render`<div>${x}${y}</div>`;
        };
        handle = t(C);
        expect(handle.text()).toBe('12');
        a.value = 'X';
        expect(handle.text()).toBe('X2');
        b.value = 'Y';
        expect(handle.text()).toBe('XY');
    });

    it('supports single-quoted attribute values', () => {
        const C: Component = () => render`<div class='single'>x</div>`;
        handle = t(C);
        expect(handle.query('div')!.className).toBe('single');
    });

    it('supports unquoted attribute values, static and slotted', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const m = state('dyn');
            ref = m;
            return render`<div id=plain data-m=${m}>x</div>`;
        };
        handle = t(C);
        const div = handle.query('div')!;
        expect(div.id).toBe('plain');
        expect(div.getAttribute('data-m')).toBe('dyn');
        ref.value = 'dyn2';
        expect(div.getAttribute('data-m')).toBe('dyn2');
    });

    it('joins multiple slots inside one attribute', () => {
        let a!: State<string>, b!: State<string>;
        const C: Component = (p, { state }) => {
            const x = state('one');
            const y = state('two');
            a = x;
            b = y;
            return render`<div class="${x} mid ${y}">x</div>`;
        };
        handle = t(C);
        expect(handle.query('div')!.className).toBe('one mid two');
        a.value = 'ONE';
        b.value = 'TWO';
        expect(handle.query('div')!.className).toBe('ONE mid TWO');
    });

    it('removes the attribute for false/null and sets it for true', () => {
        let ref!: State<boolean | null>;
        const C: Component = (p, { state }) => {
            const on = state<boolean | null>(false);
            ref = on;
            return render`<div data-on="${on}">x</div>`;
        };
        handle = t(C);
        const div = handle.query('div')!;
        expect(div.hasAttribute('data-on')).toBe(false);
        ref.value = true;
        expect(div.hasAttribute('data-on')).toBe(true);
        ref.value = null;
        expect(div.hasAttribute('data-on')).toBe(false);
    });

    it('ignores comments, including expressions inside them, without shifting later slots', () => {
        const C: Component = () => render`<div><!-- note ${'ignored'} -->${'shown'}</div>`;
        handle = t(C);
        expect(handle.text()).toBe('shown');
    });

    it('supports void elements without closing tags', () => {
        const C: Component = () => render`<div><br><img src="x.png"><input type="text"></div>`;
        handle = t(C);
        expect(handle.query('br')).not.toBeNull();
        expect(handle.query('img')!.getAttribute('src')).toBe('x.png');
        expect(handle.query('input')).not.toBeNull();
    });

    it('creates SVG elements with the SVG namespace', () => {
        const C: Component = () => render`<svg viewBox="0 0 10 10"><circle r="5" /></svg>`;
        handle = t(C);
        const circle = handle.root.querySelector('circle')!;
        expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(handle.root.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 10 10');
    });

    it('supports custom elements with dashes', () => {
        const C: Component = () => render`<my-element data-x="1">inside</my-element>`;
        handle = t(C);
        expect(handle.root.querySelector('my-element')!.textContent).toBe('inside');
    });

    it('escapes special characters arriving through slots', () => {
        const C: Component = () => render`<div>${'"quotes" & <tags> intact'}</div>`;
        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('"quotes" & <tags> intact');
        expect(handle.query('tags' as never)).toBeNull();
    });

    it('preserves inline spacing but drops template indentation', () => {
        const C: Component = () => render`<div>
            <span>a</span> <span>b</span>
        </div>`;
        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('a b');
    });

    it('throws LJS-102 for an unclosed embedded component', () => {
        const Inner: Component = () => render`<i>x</i>`;
        const C: Component = () => render`<div><${Inner}></div>`;
        expect(() => t(C)).toThrow(/LJS-10/);
    });
});

describe('Branch edge cases', () => {
    it('survives drastic list resizing: 0 → 30 → 1 → 0', () => {
        let ref!: State<number[]>;
        const C: Component = (p, { state }) => {
            const items = state<number[]>([]);
            ref = items;
            return render`<ul>${() => items.value.map((x) => render`<li>${x}</li>`)}</ul>`;
        };
        handle = t(C);
        expect(handle.queryAll('li')).toHaveLength(0);
        ref.value = Array.from({ length: 30 }, (_, i) => i);
        expect(handle.queryAll('li')).toHaveLength(30);
        expect(handle.queryAll('li')[29].textContent).toBe('29');
        ref.value = [99];
        expect(handle.queryAll('li')).toHaveLength(1);
        expect(handle.query('li')!.textContent).toBe('99');
        ref.value = [];
        expect(handle.queryAll('li')).toHaveLength(0);
    });

    it('reversing a list keeps the DOM correct (positional semantics)', () => {
        let ref!: State<string[]>;
        const C: Component = (p, { state }) => {
            const items = state(['a', 'b', 'c']);
            ref = items;
            return render`<ul>${() => items.value.map((x) => render`<li>${x}</li>`)}</ul>`;
        };
        handle = t(C);
        ref.value = ['c', 'b', 'a'];
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['c', 'b', 'a']);
    });

    it('mixes strings, views, nodes and falsy values in one array', () => {
        const em = document.createElement('em');
        em.textContent = 'node';
        const C: Component = () =>
            render`<div>${['text', false, render`<b>view</b>`, null, em, undefined, 0]}</div>`;
        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('textviewnode0');
        expect(handle.query('b')).not.toBeNull();
        expect(handle.query('em')).toBe(em);
    });

    it('switches between two different templates in the same slot', () => {
        let ref!: State<boolean>;
        const C: Component = (p, { state }) => {
            const mode = state(true);
            ref = mode;
            return render`<div>${() => (mode.value ? render`<b>bold</b>` : render`<i>italic</i>`)}</div>`;
        };
        handle = t(C);
        expect(handle.query('b')).not.toBeNull();
        ref.value = false;
        expect(handle.query('b')).toBeNull();
        expect(handle.query('i')).not.toBeNull();
        ref.value = true;
        expect(handle.query('i')).toBeNull();
        expect(handle.query('b')).not.toBeNull();
    });

    it('nested branches: a map inside a conditional inside a map', () => {
        let show!: State<boolean>;
        let outer!: State<string[][]>;
        const C: Component = (p, { state }) => {
            const visible = state(true);
            const groups = state([
                ['a', 'b'],
                ['c'],
            ]);
            show = visible;
            outer = groups;
            return render`<div>${() =>
                groups.value.map(
                    (group) =>
                        render`<ul>${() => visible.value && group.map((x) => render`<li>${x}</li>`)}</ul>`
                )}</div>`;
        };
        handle = t(C);
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['a', 'b', 'c']);
        show.value = false;
        expect(handle.queryAll('li')).toHaveLength(0);
        expect(handle.queryAll('ul')).toHaveLength(2);
        show.value = true;
        expect(handle.queryAll('li')).toHaveLength(3);
        outer.value = [['z']];
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['z']);
    });

    it('a hidden branch keeps reacting and shows fresh content on reattach', () => {
        let show!: State<boolean>;
        let count!: State<number>;
        const C: Component = (p, { state }) => {
            const visible = state(true);
            const n = state(1);
            show = visible;
            count = n;
            return render`<div>${() => visible.value && render`<b>${n}</b>`}</div>`;
        };
        handle = t(C);
        const b = handle.query('b');
        show.value = false;
        count.value = 5; // updated while hidden
        show.value = true;
        expect(handle.query('b')).toBe(b); // same element instance
        expect(handle.query('b')!.textContent).toBe('5');
    });

    it('keeps the same text node when a re-run produces equal text', () => {
        let ref!: State<string[]>;
        const C: Component = (p, { state }) => {
            const items = state(['a']);
            ref = items;
            return render`<div>${() => 'len:' + items.value.length}</div>`;
        };
        handle = t(C);
        const node = handle.query('div')!.firstChild;
        ref.value = ['b']; // same length → same text after re-run
        expect(handle.query('div')!.firstChild).toBe(node);
        expect(handle.text()).toBe('len:1');
    });

    it('slot ordering survives churn between two slots in the same parent', () => {
        let a!: State<string[]>, b!: State<string[]>;
        const C: Component = (p, { state }) => {
            const first = state(['1']);
            const second = state(['9']);
            a = first;
            b = second;
            return render`<div>${() => first.value.map((x) => render`<i>${x}</i>`)}<hr>${() =>
                second.value.map((x) => render`<b>${x}</b>`)}</div>`;
        };
        handle = t(C);
        a.value = ['1', '2'];
        b.value = ['8', '9'];
        const order = [...handle.query('div')!.children].map((c) => c.tagName.toLowerCase());
        expect(order).toEqual(['i', 'i', 'hr', 'b', 'b']);
        expect(handle.text()).toBe('1289');
    });

    it('a component template that is a single slot at the root works', () => {
        let ref!: State<boolean>;
        const C: Component = (p, { state }) => {
            const on = state(false);
            ref = on;
            return render`${() => on.value && render`<p>root branch</p>`}`;
        };
        handle = t(C);
        expect(handle.query('p')).toBeNull();
        ref.value = true;
        expect(handle.query('p')!.textContent).toBe('root branch');
        ref.value = false;
        expect(handle.query('p')).toBeNull();
    });

    it('attaches one listener per element: clicks count once after many updates', () => {
        let ref!: State<string[]>;
        let clicks = 0;
        const C: Component = (p, { state }) => {
            const items = state(['a']);
            ref = items;
            return render`<div>${() =>
                items.value.map((x) => render`<button onclick="${() => clicks++}">${x}</button>`)}</div>`;
        };
        handle = t(C);
        for (let i = 0; i < 5; i++) {
            ref.value = ['v' + i]; // same template, new values — element is reused
        }
        handle.query('button')!.click();
        expect(clicks).toBe(1);
    });

    it('deeply nested static structure around a slot updates correctly', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const v = state('deep');
            ref = v;
            return render`<div><ul><li><span class="target">${v}</span></li></ul></div>`;
        };
        handle = t(C);
        ref.value = 'deeper';
        expect(handle.query('.target')!.textContent).toBe('deeper');
    });
});

describe('Component and props edge cases', () => {
    it('recursive components terminate and render every level', () => {
        const Tree: Component<{ depth?: number }> = (props) =>
            render`<div class="n">${props.depth! > 1 ? render`<${Tree} depth="${props.depth! - 1}" />` : 'leaf'}</div>`;
        const App: Component = () => render`<main><${Tree} depth="${3}" /></main>`;
        handle = t(App);
        expect(handle.queryAll('.n')).toHaveLength(3);
        expect(handle.text()).toBe('leaf');
    });

    it('component instances in branches keep their internal state when values are unchanged', () => {
        let ref!: State<string[]>;
        const Item: Component<{ label?: string }> = (props, { state }) => {
            const n = state(0);
            return render`<li><span>${props.label}:${n}</span><button onclick="${() => n.value++}">+</button></li>`;
        };
        const App: Component = (p, { state }) => {
            const items = state(['a', 'b']);
            ref = items;
            return render`<ul>${() => items.value.map((x) => render`<${Item} label="${x}" />`)}</ul>`;
        };
        handle = t(App);
        handle.queryAll('button')[0].click();
        handle.queryAll('button')[0].click();
        expect(handle.queryAll('span')[0].textContent).toBe('a:2');

        // Append: existing entries have identical values → instances survive
        ref.value = ['a', 'b', 'c'];
        expect(handle.queryAll('span').map((s) => s.textContent)).toEqual(['a:2', 'b:0', 'c:0']);
    });

    it('removing the head shifts positions: shifted components rebuild (positional, documented)', () => {
        let ref!: State<string[]>;
        const Item: Component<{ label?: string }> = (props) => render`<li>${props.label}</li>`;
        const App: Component = (p, { state }) => {
            const items = state(['a', 'b', 'c']);
            ref = items;
            return render`<ul>${() => items.value.map((x) => render`<${Item} label="${x}" />`)}</ul>`;
        };
        handle = t(App);
        ref.value = ['b', 'c'];
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['b', 'c']);
    });

    it('props.children is undefined for self-closing components', () => {
        let captured: unknown = 'sentinel';
        const Box: Component = (props) => {
            captured = props.children;
            return render`<div>${props.children}</div>`;
        };
        const App: Component = () => render`<main><${Box} /></main>`;
        handle = t(App);
        expect(captured).toBeUndefined();
        expect(handle.query('div')!.textContent).toBe('');
    });

    it('mixed-part props arrive as resolved strings', () => {
        let captured: unknown;
        const Box: Component<{ title?: string }> = (props) => {
            captured = props.title;
            return render`<div></div>`;
        };
        const App: Component = (p, { state }) => {
            const n = state(5);
            return render`<main><${Box} title="Total: ${n}" /></main>`;
        };
        handle = t(App);
        expect(captured).toBe('Total: 5');
    });

    it('the same component twice in one template gets independent props', () => {
        const Badge: Component<{ label?: string }> = (props) => render`<b>${props.label}</b>`;
        const App: Component = () => render`<div><${Badge} label="one" /><${Badge} label="two" /></div>`;
        handle = t(App);
        expect(handle.queryAll('b').map((b) => b.textContent)).toEqual(['one', 'two']);
    });

    it('event handlers receive the DOM event', () => {
        let type = '';
        let value = '';
        const C: Component = () =>
            render`<div><input oninput="${(e: Event) => {
                type = e.type;
                value = (e.target as HTMLInputElement).value;
            }}" /></div>`;
        handle = t(C);
        const input = handle.query('input') as HTMLInputElement;
        input.value = 'typed';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(type).toBe('input');
        expect(value).toBe('typed');
    });
});

describe('Mount, onMount (v5: onload) and unmount edge cases', () => {
    it('mounts two independent apps into the same root', () => {
        const A: Component = () => render`<p class="a">A</p>`;
        const B: Component = () => render`<p class="b">B</p>`;
        const root = document.createElement('div');
        document.body.appendChild(root);
        const ha = mount(A, root);
        const hb = mount(B, root);
        expect(root.querySelectorAll('p')).toHaveLength(2);
        ha.unmount();
        expect(root.querySelector('.a')).toBeNull();
        expect(root.querySelector('.b')).not.toBeNull();
        hb.unmount();
        root.remove();
    });

    it('mounting into a root with existing content appends after it', () => {
        const root = document.createElement('div');
        root.innerHTML = '<span id="existing">keep</span>';
        document.body.appendChild(root);
        const C: Component = () => render`<p>new</p>`;
        const h = mount(C, root);
        expect(root.querySelector('#existing')).not.toBeNull();
        expect(root.firstElementChild!.id).toBe('existing');
        h.unmount();
        expect(root.querySelector('#existing')).not.toBeNull();
        root.remove();
    });

    it('unmount is idempotent — calling it twice is safe', () => {
        const C: Component = () => render`<p>x</p>`;
        const root = document.createElement('div');
        document.body.appendChild(root);
        const h = mount(C, root);
        h.unmount();
        expect(() => h.unmount()).not.toThrow();
        root.remove();
    });

    it('multiple onMount callbacks run in registration order, children before parents', () => {
        const order: string[] = [];
        const Child: Component = (p, { onMount }) => {
            onMount(() => order.push('child'));
            return render`<i>c</i>`;
        };
        const C: Component = (p, { onMount }) => {
            onMount(() => order.push('parent-1'));
            onMount(() => order.push('parent-2'));
            return render`<div><${Child} /></div>`;
        };
        handle = t(C);
        expect(order).toEqual(['child', 'parent-1', 'parent-2']);
    });

    it('assigning state inside onMount updates the DOM synchronously', () => {
        const C: Component = (p, { state, onMount }) => {
            const n = state(0);
            onMount(() => {
                n.value = 42;
            });
            return render`<div>${n}</div>`;
        };
        handle = t(C);
        expect(handle.text()).toBe('42');
    });

    it('a component mounted later by a branch gets its onMount, once', () => {
        let mounts = 0;
        let show!: State<boolean>;
        const Late: Component = (p, { onMount }) => {
            onMount(() => mounts++);
            return render`<p>late</p>`;
        };
        const C: Component = (p, { state }) => {
            const on = state(false);
            show = on;
            return render`<div>${() => on.value && render`<${Late} />`}</div>`;
        };
        handle = t(C);
        expect(mounts).toBe(0);
        show.value = true;
        expect(mounts).toBe(1);
        // hide + show reuses the detached DOM: no remount
        show.value = false;
        show.value = true;
        expect(mounts).toBe(1);
    });

    it('list shrink unmounts removed components and runs their cleanups', () => {
        const log: string[] = [];
        let ref!: State<string[]>;
        const Item: Component<{ id?: string }> = (props, { onMount, onUnmount }) => {
            onMount(() => () => log.push('cleanup:' + props.id));
            onUnmount(() => log.push('unmount:' + props.id));
            return render`<li>${props.id}</li>`;
        };
        const App: Component = (p, { state }) => {
            const items = state(['a', 'b', 'c']);
            ref = items;
            return render`<ul>${() => items.value.map((x) => render`<${Item} id="${x}" />`)}</ul>`;
        };
        handle = t(App);
        ref.value = ['a'];
        expect(log).toContain('unmount:b');
        expect(log).toContain('cleanup:b');
        expect(log).toContain('unmount:c');
        expect(log).not.toContain('unmount:a');
    });

    it('unmounting the parent unmounts nested branch components depth-first', () => {
        const log: string[] = [];
        const Deep: Component = (p, { onUnmount }) => {
            onUnmount(() => log.push('deep'));
            return render`<i>d</i>`;
        };
        const Mid: Component = (p, { state, onUnmount }) => {
            const on = state(true);
            onUnmount(() => log.push('mid'));
            return render`<div>${() => on.value && render`<${Deep} />`}</div>`;
        };
        const App: Component = (p, { onUnmount }) => {
            onUnmount(() => log.push('app'));
            return render`<main><${Mid} /></main>`;
        };
        const local = t(App);
        local.unmount();
        expect(log).toContain('deep');
        expect(log).toContain('mid');
        expect(log).toContain('app');
        expect(log.indexOf('mid')).toBeLessThan(log.indexOf('app'));
    });

    it('ref runs before onMount and both see the same element', () => {
        const order: string[] = [];
        let refEl: Element | null = null;
        let mountEl: Node | null = null;
        const C: Component = (p, { onMount }) => {
            onMount((el) => {
                order.push('mount');
                mountEl = el;
            });
            return render`<section ref="${(el: Element) => {
                order.push('ref');
                refEl = el;
            }}">x</section>`;
        };
        handle = t(C);
        expect(order).toEqual(['ref', 'mount']);
        expect(refEl).toBe(mountEl);
    });

    it('full integration: a todo app survives a realistic interaction storm', () => {
        type Task = { id: number; title: string; done: boolean };
        let tasks!: State<Task[]>;
        let filter!: State<'all' | 'open'>;

        const App: Component = (p, { state }) => {
            const list = state<Task[]>([]);
            const mode = state<'all' | 'open'>('all');
            tasks = list;
            filter = mode;
            const visible = () =>
                mode.value === 'all' ? list.value : list.value.filter((x) => !x.done);
            return render`<div>
                <p class="count">${() => list.value.filter((x) => !x.done).length} open</p>
                <ul>${() =>
                    visible().map(
                        (task) => render`<li class="${task.done ? 'done' : 'open'}">${task.title}</li>`
                    )}</ul>
                ${() => list.value.length === 0 && render`<p class="empty">nothing here</p>`}
            </div>`;
        };

        handle = t(App);
        expect(handle.query('.empty')).not.toBeNull();

        tasks.value = [
            { id: 1, title: 'one', done: false },
            { id: 2, title: 'two', done: false },
            { id: 3, title: 'three', done: true },
        ];
        expect(handle.query('.empty')).toBeNull();
        expect(handle.query('.count')!.textContent).toBe('2 open');
        expect(handle.queryAll('li')).toHaveLength(3);

        filter.value = 'open';
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['one', 'two']);

        tasks.value = tasks.value.map((x) => (x.id === 1 ? { ...x, done: true } : x));
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['two']);
        expect(handle.query('.count')!.textContent).toBe('1 open');

        filter.value = 'all';
        expect(handle.queryAll('li')).toHaveLength(3);
        expect(handle.queryAll('li.done')).toHaveLength(2);

        tasks.value = [];
        expect(handle.query('.empty')).not.toBeNull();
        expect(handle.query('.count')!.textContent).toBe('0 open');
    });
});
