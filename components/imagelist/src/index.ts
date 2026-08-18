/**
 * <ImageList /> — a responsive image grid (new in v6, no v5 source).
 *
 * Three layouts, all driven by deterministic inline styles (jsdom-testable):
 *   - standard (default): CSS grid — grid-template-columns repeat(columns,
 *     1fr), gap, and grid-auto-rows when rowheight > 0 (rowheight 0 = the
 *     rows size themselves to their content)
 *   - masonry: CSS multi-column layout (columns: N + column-gap; items
 *     carry break-inside: avoid and the vertical gap) — ragged bottoms,
 *     natural image heights
 *   - quilted: the standard grid, but items may span cells through
 *     item.cols / item.rows (grid-column / grid-row: span X)
 *
 * Item bars (bar): a translucent overlay at the bottom of each image with
 * the item title + optional subtitle.
 *
 * Images load lazily (loading="lazy"); the alt text is item.alt, falling
 * back to item.title, then ''. data is held BY REFERENCE: mutate the
 * array or its records and call data.touch() to re-render — or assign
 * a new array. onitemclick(item, index, event) makes tiles interactive
 * (cursor through data-clickable, plus role="button", tabindex and
 * Enter/Space activation).
 */

import { component, css, html } from 'lemonadejs';

export interface ImageListItem {
    /** Image URL */
    src: string;
    /** Caption — the bar's first line and the alt fallback */
    title?: string;
    /** Image alt text (falls back to title, then '') */
    alt?: string;
    /** Muted second line in the bar */
    subtitle?: string;
    /** Quilted: columns this item spans (default 1) */
    cols?: number;
    /** Quilted: rows this item spans (default 1) */
    rows?: number;
}

export const ImageList = component('imagelist', {
    data: Array,                  // ImageListItem[] BY REFERENCE (mutate + touch())
    columns: 3,                   // grid columns (masonry: CSS column count)
    gap: 8,                       // px between tiles
    rowheight: 164,               // px per grid row; 0 = natural heights
    variant: '',                  // '' standard | 'masonry' | 'quilted'
    bar: false,                   // overlay title bar on each image
    onitemclick: Function,        // (item, index, event)
}, (props) => {
    const items = () => (props.data.value as ImageListItem[]) || [];

    const columns = () => Math.max(1, parseInt(String(props.columns.value), 10) || 0);
    const gap = () => Math.max(0, parseInt(String(props.gap.value), 10) || 0);

    const rootStyle = () => {
        if (props.variant.value === 'masonry') {
            // Multi-column flow: top-to-bottom fill, ragged bottom edge
            return css({ columns: columns(), columnGap: gap() });
        }
        const rh = parseInt(String(props.rowheight.value), 10);
        return css({
            display: 'grid',
            gridTemplateColumns: 'repeat(' + columns() + ', 1fr)',
            gap: gap(),
            gridAutoRows: rh > 0 && rh,
        });
    };

    const itemStyle = (item: ImageListItem): string | false => {
        if (props.variant.value === 'masonry') {
            // Column boxes have no row gap of their own — the item carries it
            return 'break-inside:avoid;margin-bottom:' + gap() + 'px;';
        }
        if (props.variant.value === 'quilted') {
            let css = '';
            const cols = parseInt(String(item.cols), 10);
            const rows = parseInt(String(item.rows), 10);
            if (cols > 1) {
                css += 'grid-column:span ' + cols + ';';
            }
            if (rows > 1) {
                css += 'grid-row:span ' + rows + ';';
            }
            return css || false;
        }
        return false;
    };

    // Events arrive as plain functions (or undefined), not states
    const onitemclick = props.onitemclick as
        | ((item: ImageListItem, index: number, e: MouseEvent | KeyboardEvent) => void)
        | undefined;

    return html`<div class="lm-imagelist"
        data-variant="${() => props.variant.value || false}"
        style="${() => rootStyle()}">${() =>
        items().map((item, index) => html`<div class="lm-imagelist-item" key="${item}"
            data-clickable="${onitemclick ? 'true' : false}"
            role="${onitemclick ? 'button' : false}"
            tabindex="${onitemclick ? '0' : false}"
            style="${() => itemStyle(item)}"
            onclick="${(e: MouseEvent) => onitemclick?.(item, index, e)}"
            onkeydown="${(e: KeyboardEvent) => {
                // role=button contract: Enter/Space activate like a click
                if (onitemclick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onitemclick(item, index, e);
                }
            }}">
            <img class="lm-imagelist-img" loading="lazy"
                src="${item.src || ''}" alt="${item.alt ?? item.title ?? ''}" />
            ${() =>
                props.bar.value
                    ? html`<div class="lm-imagelist-bar">
                          <div class="lm-imagelist-title">${item.title || ''}</div>
                          ${item.subtitle
                              ? html`<div class="lm-imagelist-subtitle">${item.subtitle}</div>`
                              : ''}
                      </div>`
                    : ''}
        </div>`)
    }</div>`;
});

export default ImageList;
