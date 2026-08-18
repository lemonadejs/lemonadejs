/**
 * <Transferlist /> — two side-by-side lists with a middle column of
 * controls that move checked items between them (on the v6 contract
 * model).
 *
 * Left list: the items NOT chosen, in data order. Right list: the chosen
 * items, in chosen order. Each row carries a checkbox; the controls move
 * all/checked items right/left and disable when nothing applies. Checked
 * state is internal — one Set per side — and clears after every move.
 *
 * bind="${state}" holds the CHOSEN side's values as an array. User moves
 * commit through set() (fires onchange with the new chosen array);
 * external writes stay silent. data is read BY REFERENCE: live data
 * changes keep the chosen values that still exist.
 */

import { batch, component, html, type State } from 'lemonadejs';

export type TransferValue = string | number;

export interface TransferItem {
    value: TransferValue;
    label?: string;
    disabled?: boolean;
}

/** Strings/numbers normalize to { value, label } */
const normalize = (list: unknown[]): TransferItem[] =>
    (list || []).map((v) =>
        typeof v === 'string' || typeof v === 'number' ? { value: v, label: String(v) } : (v as TransferItem)
    );

/** The bound value is an array; tolerate scalar/empty writes */
const asArray = (v: unknown): TransferValue[] => {
    if (Array.isArray(v)) {
        return v as TransferValue[];
    }
    return v === '' || v === null || v === undefined ? [] : [v as TransferValue];
};

const text = (item: TransferItem): string => (item.label !== undefined ? String(item.label) : String(item.value));

export const Transferlist = component('transferlist', {
    bind: Array,                  // the chosen values, as an array (two-way)
    data: Array,                  // TransferItem[] — strings/numbers normalize
    titles: ['Available', 'Chosen'],
    search: false,                // a filter box above each list
    height: 280,                  // list viewport height (px, scrollable)
    onchange: Function,           // (chosen) on user moves; external writes silent
    api: { getChosen: Function, moveAll: Function, reset: Function },
}, (props, { bind, state, onMount }) => {
    const chosen = bind(props, [] as unknown[]);

    const checkedLeft = state(new Set<TransferValue>());
    const checkedRight = state(new Set<TransferValue>());
    const queryLeft = state('');
    const queryRight = state('');

    // ---- derived views (tracked: re-run when data/chosen/checks change)
    const items = () => normalize((props.data.value as unknown[]) || []);
    const chosenValues = () => asArray(chosen.value);

    const leftItems = () => {
        const inChosen = new Set(chosenValues());
        return items().filter((item) => !inChosen.has(item.value));
    };

    const rightItems = () => {
        const byValue = new Map(items().map((item) => [item.value, item]));
        return chosenValues()
            .map((v) => byValue.get(v))
            .filter((item): item is TransferItem => !!item);
    };

    // ---- untracked reads for handlers and subscriptions
    const peekItems = () => normalize((props.data.peek() as unknown[]) || []);
    const peekChosen = () => asArray(chosen.peek());

    /** Drop checked values that no longer belong to their side */
    const prune = (checked: State<Set<TransferValue>>, keep: (v: TransferValue) => boolean) => {
        const set = checked.peek();
        let changed = false;
        for (const v of [...set]) {
            if (!keep(v)) {
                set.delete(v);
                changed = true;
            }
        }
        if (changed) {
            checked.touch();
        }
    };

    // ---- moves: user-initiated commits go through set() → onchange
    const commit = (next: TransferValue[]) =>
        batch(() => {
            chosen.set(next);
            checkedLeft.value = new Set();
            checkedRight.value = new Set();
        });

    const moveRight = () => {
        const marked = checkedLeft.peek();
        const current = peekChosen();
        const inChosen = new Set(current);
        const moved = peekItems()
            .filter((item) => !item.disabled && marked.has(item.value) && !inChosen.has(item.value))
            .map((item) => item.value);
        if (moved.length) {
            commit([...current, ...moved]);
        }
    };

    const moveLeft = () => {
        const marked = checkedRight.peek();
        const current = peekChosen();
        const next = current.filter((v) => !marked.has(v));
        if (next.length !== current.length) {
            commit(next);
        }
    };

    const moveAll = (direction?: 'right' | 'left') => {
        const current = peekChosen();
        if (direction === 'left') {
            // Disabled chosen items are unmovable — they stay chosen
            const locked = new Set(peekItems().filter((item) => item.disabled).map((item) => item.value));
            const next = current.filter((v) => locked.has(v));
            if (next.length !== current.length) {
                commit(next);
            }
        } else {
            const inChosen = new Set(current);
            const moved = peekItems()
                .filter((item) => !item.disabled && !inChosen.has(item.value))
                .map((item) => item.value);
            if (moved.length) {
                commit([...current, ...moved]);
            }
        }
    };

    const toggleCheck = (checked: State<Set<TransferValue>>, item: TransferItem) => {
        if (item.disabled) {
            return;
        }
        const set = checked.peek();
        if (set.has(item.value)) {
            set.delete(item.value);
        } else {
            set.add(item.value);
        }
        checked.touch();
    };

    // External chosen writes land silently — checks follow the sides
    onMount(() =>
        chosen.subscribe(() => {
            const inChosen = new Set(peekChosen());
            prune(checkedLeft, (v) => !inChosen.has(v));
            prune(checkedRight, (v) => inChosen.has(v));
        })
    );

    // Live data changes keep the chosen values that still exist (silent)
    onMount(() =>
        props.data.subscribe(() => {
            const values = new Set(peekItems().map((item) => item.value));
            const current = peekChosen();
            const kept = current.filter((v) => values.has(v));
            if (kept.length !== current.length) {
                chosen.value = kept; // silent revalidation
            }
            prune(checkedLeft, (v) => values.has(v));
            prune(checkedRight, (v) => values.has(v));
        })
    );

    // ---- api
    props.ref?.({
        getChosen: () => [...peekChosen()],
        moveAll: (direction?: 'right' | 'left') => moveAll(direction),
        reset: () =>
            batch(() => {
                // Programmatic restore: silent, like an external write
                chosen.value = [];
                checkedLeft.value = new Set();
                checkedRight.value = new Set();
                queryLeft.value = '';
                queryRight.value = '';
            }),
    });

    // ---- rendering
    const titleOf = (side: 'left' | 'right') => {
        const titles = (props.titles.value as string[]) || [];
        return side === 'left' ? titles[0] ?? 'Available' : titles[1] ?? 'Chosen';
    };

    const matches = (item: TransferItem, q: string) => !q || text(item).toLowerCase().includes(q.toLowerCase());

    // Keyed by item.value — the identity the whole component reasons in.
    // Within a side, moves remove items MID-LIST (and search filters them):
    // keys move the surviving rows instead of rebuilding them. A move
    // ACROSS sides still rebuilds (keys are scoped per list — engine rule).
    const rowView = (item: TransferItem, checked: State<Set<TransferValue>>) => html`<label
        key="${item.value}"
        class="lm-transferlist-item"
        data-disabled="${item.disabled === true ? 'true' : false}">
        <input type="checkbox" class="lm-transferlist-checkbox"
            checked="${() => checked.value.has(item.value)}"
            disabled="${item.disabled === true}"
            onchange="${() => toggleCheck(checked, item)}" />
        <span class="lm-transferlist-label">${text(item)}</span>
    </label>`;

    const listView = (side: 'left' | 'right') => {
        const all = side === 'left' ? leftItems : rightItems;
        const query = side === 'left' ? queryLeft : queryRight;
        const checked = side === 'left' ? checkedLeft : checkedRight;
        const visible = () => all().filter((item) => matches(item, query.value));
        const searchLabel = () => {
            const title = titleOf(side);
            return title ? 'Search ' + title : 'Search';
        };
        return html`<div class="lm-transferlist-list" data-side="${side}">
            <div class="lm-transferlist-header">
                <div class="lm-transferlist-title">${() => titleOf(side)}</div>
                <div class="lm-transferlist-count">${() =>
                    all().filter((item) => checked.value.has(item.value)).length +
                    '/' + all().length + ' selected'}</div>
            </div>
            ${() =>
                props.search.value
                    ? html`<input type="search" class="lm-transferlist-search" placeholder="Search"
                          aria-label="${() => searchLabel()}"
                          value="${() => query.value}"
                          oninput="${(e: Event) => (query.value = (e.target as HTMLInputElement).value)}" />`
                    : ''}
            <div class="lm-transferlist-items" role="group" aria-label="${() => titleOf(side)}"
                style="height:${() => props.height.value}px">
                ${() => visible().map((item) => rowView(item, checked))}
                ${() => (visible().length === 0 ? html`<div class="lm-transferlist-empty">No items</div>` : '')}
            </div>
        </div>`;
    };

    return html`<div class="lm-transferlist" data-search="${() => (props.search.value ? 'true' : false)}">
        ${listView('left')}
        <div class="lm-transferlist-controls">
            <button type="button" class="lm-transferlist-button" data-action="all-right" aria-label="Move all right"
                disabled="${() => !leftItems().some((item) => !item.disabled)}"
                onclick="${() => moveAll('right')}">»</button>
            <button type="button" class="lm-transferlist-button" data-action="right" aria-label="Move checked right"
                disabled="${() => checkedLeft.value.size === 0}"
                onclick="${moveRight}">›</button>
            <button type="button" class="lm-transferlist-button" data-action="left" aria-label="Move checked left"
                disabled="${() => checkedRight.value.size === 0}"
                onclick="${moveLeft}">‹</button>
            <button type="button" class="lm-transferlist-button" data-action="all-left" aria-label="Move all left"
                disabled="${() => !rightItems().some((item) => !item.disabled)}"
                onclick="${() => moveAll('left')}">«</button>
        </div>
        ${listView('right')}
    </div>`;
});

export default Transferlist;
