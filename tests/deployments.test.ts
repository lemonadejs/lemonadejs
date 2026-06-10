/**
 * One block, three deployments — the publishing promise, proven with a
 * real Studio block (Datagrid):
 *
 *   1. by value:   <${Datagrid} />          import, no registration
 *   2. by name:    <Datagrid />             setComponents once, anywhere
 *   3. custom el:  <lm-datagrid>            createWebComponent, any host
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, setComponents, createWebComponent, type Component } from '../src/index';
import { render as t } from '../src/test';
import Datagrid, { type Column } from '@lemonadejs/datagrid';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const rows = () =>
    Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: 'Row ' + (i + 1) }));
const columns: Column[] = [
    { name: 'id', title: 'ID', type: 'number', width: '60px' },
    { name: 'name', title: 'Name' },
];

describe('one block, three deployments', () => {
    it('by NAME: setComponents({ Datagrid }) enables <Datagrid /> in templates', () => {
        setComponents({ Datagrid: Datagrid as never });
        const App: Component = () =>
            html`<div><Datagrid data="${rows()}" columns="${columns}" pagination="${4}" /></div>`;
        handle = t(App);
        expect(handle.queryAll('.lm-datagrid-row')).toHaveLength(4);
        expect(handle.query('.lm-datagrid-pageinfo')!.textContent).toBe('1–4 of 6 rows');
    });

    it('as a CUSTOM ELEMENT: createWebComponent(Datagrid) → <lm-datagrid>', async () => {
        const tag = createWebComponent(Datagrid as never);
        expect(tag).toBe('lm-datagrid');

        const el = document.createElement(tag) as HTMLElement & {
            data: unknown;
            columns: unknown;
            pagination: unknown;
            unmount(): void;
        };
        // Rich values travel as element PROPERTIES (the core-of-HTML way)
        el.data = rows();
        el.columns = columns;
        el.pagination = 4;
        document.body.appendChild(el);

        expect(el.querySelectorAll('.lm-datagrid-row')).toHaveLength(4);

        //

        // Declared props stay LIVE through the property accessors
        el.pagination = 2;
        expect(el.querySelectorAll('.lm-datagrid-row')).toHaveLength(2);

        // Removal destroys (microtask grace) — the v6 auto-unmount policy
        el.remove();
        await flush();
        expect(el.querySelector('.lm-datagrid')).toBeNull();
    });

    it('inside a lemonade template, <lm-datagrid> takes object props directly', async () => {
        createWebComponent(Datagrid as never);
        const App: Component = () =>
            html`<div><lm-datagrid data="${rows()}" columns="${columns}" pagination="${3}"></lm-datagrid></div>`;
        handle = t(App);
        await flush();
        expect(handle.queryAll('.lm-datagrid-row')).toHaveLength(3);
    });
});
