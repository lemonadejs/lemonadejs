/* One-shot a11y patch: card, tabs, signature, datagrid, rating, color, modal. Deleted after use. */
import { readFileSync, writeFileSync } from 'node:fs';

const patch = (file, pairs) => {
    let s = readFileSync(file, 'utf8');
    for (const [from, to] of pairs) {
        if (!s.includes(from)) throw new Error(file + ': anchor not found: ' + from.slice(0, 70));
        s = s.replace(from, to);
    }
    writeFileSync(file, s);
    console.log('patched ' + file);
};

// 1. card: Enter/Space activate the clickable surface (role=button contract)
patch('card/src/index.ts', [[
`        tabindex="\${() => (props.clickable.value ? '0' : false)}"
        onclick="\${press}">`,
`        tabindex="\${() => (props.clickable.value ? '0' : false)}"
        onkeydown="\${(e: KeyboardEvent) => {
            // role=button contract: Enter/Space activate like a click
            if (props.clickable.value && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                props.onclick?.(e);
            }
        }}"
        onclick="\${press}">`,
]]);

// 2. tabs: roving tabindex + aria-orientation + Space activates
patch('tabs/src/index.ts', [
    [`tabindex="0" role="tab" draggable="true"`,
        `tabindex="\${() => (selected.value === i ? '0' : '-1')}" role="tab" draggable="true"`],
    [`<div class="lm-tabs-headers" role="tablist"`,
        `<div class="lm-tabs-headers" role="tablist" aria-orientation="horizontal"`],
    [`        if (e.key === 'Enter') {
            const index = headerIndex(e.target);
            if (index >= 0) {
                doSelect(index);
            }`,
        `        if (e.key === 'Enter' || e.key === ' ') {
            const index = headerIndex(e.target);
            if (index >= 0) {
                e.preventDefault(); // Space must not scroll the page
                doSelect(index);
            }`],
]);

// 3. rating: the WAI slider pattern — the container carries value semantics
//    and arrow keys step it; the stars become decoration
patch('rating/src/index.ts', [
    [`    // v5 parity: shrinking the star count clamps the value`,
        `    // Keyboard (slider pattern): arrows step the value, committed like a click
    const onArrow = (e: KeyboardEvent) => {
        if (!interactive()) {
            return;
        }
        const cur = Number(rating.value) || 0;
        const max = Math.max(0, Number(props.number.value) || 0);
        let next: number | null = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            next = Math.min(max, cur + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            next = Math.max(0, cur - 1);
        }
        if (next !== null) {
            e.preventDefault();
            if (next !== cur) {
                rating.set(next);
                root?.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    };

    // v5 parity: shrinking the star count clamps the value`],
    [`    return html\`<div class="lm-rating"`,
        `    return html\`<div class="lm-rating"
        role="slider"
        tabindex="\${() => (interactive() ? '0' : false)}"
        aria-valuemin="0"
        aria-valuemax="\${() => Math.max(0, Number(props.number.value) || 0)}"
        aria-valuenow="\${() => Number(rating.value) || 0}"
        aria-label="\${() => (props.name.value as string) || 'Rating'}"
        onkeydown="\${onArrow}"`],
    [`(_, i) => html\`<i class="lm-rating-star"`,
        `(_, i) => html\`<i class="lm-rating-star" aria-hidden="true"`],
]);

// 4. signature: the canvas is an image to assistive tech
patch('signature/src/index.ts', [[
    `<canvas class="lm-signature-canvas"`,
    `<canvas class="lm-signature-canvas" role="img" aria-label="Signature"`,
]]);

// 5. datagrid: aria-rowindex (1 = the header row, data rows follow)
patch('datagrid/src/index.ts', [
    [`const headerView = () => html\`<div class="lm-datagrid-header" role="row"`,
        `const headerView = () => html\`<div class="lm-datagrid-header" role="row" aria-rowindex="1"`],
    [`            role="row"
            style="\${() => 'height:' + rowHeight() + 'px;grid-template-columns:' + gridTemplate()}"`,
        `            role="row"
            aria-rowindex="\${entry.dataIndex + 2}"
            style="\${() => 'height:' + rowHeight() + 'px;grid-template-columns:' + gridTemplate()}"`],
]);

// 6. color: tablist/tab semantics for the view switch; grid/gridcell +
//    a readable colour name for the palette cells
patch('color/src/index.ts', [
    [`<div class="lm-color-tabs">`,
        `<div class="lm-color-tabs" role="tablist">`],
    [`<button type="button" class="lm-color-tab"
                    data-active="\${() => tab.value === 'grid' || false}"
                    onclick="\${() => (tab.value = 'grid')}">Grid</button>`,
        `<button type="button" class="lm-color-tab" role="tab"
                    aria-selected="\${() => (tab.value === 'grid' ? 'true' : 'false')}"
                    data-active="\${() => tab.value === 'grid' || false}"
                    onclick="\${() => (tab.value = 'grid')}">Grid</button>`],
    [`<button type="button" class="lm-color-tab"
                    data-active="\${() => tab.value === 'spectrum' || false}"
                    onclick="\${() => (tab.value = 'spectrum')}">Spectrum</button>`,
        `<button type="button" class="lm-color-tab" role="tab"
                    aria-selected="\${() => (tab.value === 'spectrum' ? 'true' : 'false')}"
                    data-active="\${() => tab.value === 'spectrum' || false}"
                    onclick="\${() => (tab.value = 'spectrum')}">Spectrum</button>`],
    [`html\`<div class="lm-color-grid">`,
        `html\`<div class="lm-color-grid" role="grid" aria-label="Color palette">`],
    [`(row) => html\`<div class="lm-color-row">`,
        `(row) => html\`<div class="lm-color-row" role="row">`],
    [`(c) => html\`<div class="lm-color-cell \${() =>
                                pending.value === c ? 'lm-color-selected' : ''}"
                                data-value="\${c}"`,
        `(c) => html\`<div class="lm-color-cell \${() =>
                                pending.value === c ? 'lm-color-selected' : ''}"
                                role="gridcell"
                                aria-selected="\${() => (pending.value === c ? 'true' : 'false')}"
                                aria-label="\${c}"
                                data-value="\${c}"`],
]);

// 7. modal: role pass-through — dialog semantics for backdrop modals by
//    default, overridable (or suppressible) for headless panel usage
patch('modal/src/index.ts', [
    [`    autoclose: false,             // v5: auto-close`,
        `    role: '',                     // ARIA role: '' = auto (backdrop → dialog, else none)
    autoclose: false,             // v5: auto-close`],
    [`                style="\${styles}"
                tabindex="-1"`,
        `                style="\${styles}"
                role="\${() => props.role.value || (props.backdrop.value ? 'dialog' : false)}"
                aria-modal="\${() => ((props.role.value || (props.backdrop.value ? 'dialog' : '')) === 'dialog' ? 'true' : false)}"
                aria-label="\${() => props.title.value || false}"
                tabindex="-1"`],
]);

console.log('all patched');
