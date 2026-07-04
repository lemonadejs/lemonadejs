/**
 * Table structure operations for the Editor block — pure DOM surgery,
 * fully span-aware, no layout reads (unit-testable in jsdom).
 *
 * Everything works on the OCCUPANCY GRID: buildGrid() expands colspan /
 * rowspan into a matrix where grid[r][c] is the cell COVERING that
 * coordinate (a spanning cell appears at every coordinate it covers).
 * All structural ops — insert/delete row/column, merge, split — reason
 * about boundaries on that grid, which is what makes them correct next
 * to merged cells (the classic failure of naive row/col loops).
 */

export type Grid = HTMLTableCellElement[][];

export const buildGrid = (table: HTMLTableElement): Grid => {
    const grid: Grid = [];
    for (let r = 0; r < table.rows.length; r++) {
        grid[r] = grid[r] || [];
        let c = 0;
        for (const cell of Array.from(table.rows[r].cells)) {
            while (grid[r][c]) {
                c++;
            }
            for (let dr = 0; dr < (cell.rowSpan || 1); dr++) {
                grid[r + dr] = grid[r + dr] || [];
                for (let dc = 0; dc < (cell.colSpan || 1); dc++) {
                    grid[r + dr][c + dc] = cell;
                }
            }
            c += cell.colSpan || 1;
        }
    }
    return grid;
};

export const columnCount = (table: HTMLTableElement): number => {
    const grid = buildGrid(table);
    let width = 0;
    for (const row of grid) {
        width = Math.max(width, row.length);
    }
    return width;
};

/** The top-left coordinate of a cell on the grid */
export const cellPosition = (grid: Grid, cell: HTMLTableCellElement): { row: number; col: number } | null => {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === cell) {
                return { row: r, col: c };
            }
        }
    }
    return null;
};

const filler = (tag: string): HTMLTableCellElement => {
    const cell = document.createElement(tag) as HTMLTableCellElement;
    cell.innerHTML = '<br>';
    return cell;
};

/** A fresh, unstyled editing table (colgroup ready for column resizing) */
export const createTable = (rows: number, cols: number): HTMLTableElement => {
    const table = document.createElement('table');
    table.className = 'lm-editor-table';
    const colgroup = document.createElement('colgroup');
    for (let c = 0; c < cols; c++) {
        colgroup.appendChild(document.createElement('col'));
    }
    table.appendChild(colgroup);
    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            tr.appendChild(filler('td'));
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
};

/** The colgroup, created to match the real column count when missing —
 *  column resizing writes widths on its <col> entries */
export const ensureColgroup = (table: HTMLTableElement): HTMLTableColElement[] => {
    let colgroup = table.querySelector(':scope > colgroup') as HTMLElement | null;
    const width = columnCount(table);
    if (!colgroup) {
        colgroup = document.createElement('colgroup');
        table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < width) {
        colgroup.appendChild(document.createElement('col'));
    }
    while (colgroup.children.length > width) {
        colgroup.lastElementChild!.remove();
    }
    return Array.from(colgroup.children) as HTMLTableColElement[];
};

export const insertRow = (table: HTMLTableElement, cell: HTMLTableCellElement, after: boolean): void => {
    const grid = buildGrid(table);
    const pos = cellPosition(grid, cell);
    if (!pos) {
        return;
    }
    const width = Math.max(...grid.map((row) => row.length));
    // the grid row index the new row lands on
    const at = after ? pos.row + (cell.rowSpan || 1) : pos.row;
    const tr = document.createElement('tr');
    const crossed = new Set<HTMLTableCellElement>();
    for (let c = 0; c < width; c++) {
        const above = at > 0 ? grid[at - 1]?.[c] : undefined;
        const below = at < grid.length ? grid[at]?.[c] : undefined;
        if (above && above === below) {
            // a rowspan crosses the insertion line — grow it instead
            if (!crossed.has(above)) {
                above.rowSpan = (above.rowSpan || 1) + 1;
                crossed.add(above);
            }
        } else {
            tr.appendChild(filler('td'));
        }
    }
    const ref = table.rows[at] || null;
    if (ref) {
        ref.parentElement!.insertBefore(tr, ref);
    } else {
        (table.tBodies[0] || table).appendChild(tr);
    }
};

export const deleteRow = (table: HTMLTableElement, cell: HTMLTableCellElement): void => {
    const grid = buildGrid(table);
    const pos = cellPosition(grid, cell);
    if (!pos || table.rows.length <= 1) {
        return;
    }
    const r = pos.row;
    const row = table.rows[r];
    const handled = new Set<HTMLTableCellElement>();
    for (let c = 0; c < (grid[r] || []).length; c++) {
        const el = grid[r][c];
        if (!el || handled.has(el)) {
            continue;
        }
        handled.add(el);
        if ((el.rowSpan || 1) > 1) {
            el.rowSpan = el.rowSpan - 1;
            if (el.parentElement === row) {
                // starts on the deleted row — the remainder moves down
                const next = table.rows[r + 1];
                let ref: HTMLTableCellElement | null = null;
                for (const cand of Array.from(next.cells)) {
                    const cp = cellPosition(grid, cand);
                    if (cp && cp.col > c) {
                        ref = cand;
                        break;
                    }
                }
                next.insertBefore(el, ref);
            }
        }
    }
    row.remove();
};

export const insertColumn = (table: HTMLTableElement, cell: HTMLTableCellElement, after: boolean): void => {
    const grid = buildGrid(table);
    const pos = cellPosition(grid, cell);
    if (!pos) {
        return;
    }
    const at = after ? pos.col + (cell.colSpan || 1) : pos.col;
    const crossed = new Set<HTMLTableCellElement>();
    for (let r = 0; r < grid.length; r++) {
        const left = at > 0 ? grid[r][at - 1] : undefined;
        const right = grid[r][at];
        if (left && left === right) {
            // a colspan crosses the boundary — grow it instead
            if (!crossed.has(left)) {
                left.colSpan = (left.colSpan || 1) + 1;
                crossed.add(left);
            }
            continue;
        }
        const tr = table.rows[r];
        let ref: HTMLTableCellElement | null = null;
        for (const cand of Array.from(tr.cells)) {
            const cp = cellPosition(grid, cand);
            if (cp && cp.col >= at) {
                ref = cand;
                break;
            }
        }
        // rowspan continuations own the coordinate in OTHER rows — each tr
        // still receives exactly one new cell unless a span crossed above
        const neighbor = right || left;
        tr.insertBefore(filler(neighbor ? neighbor.tagName : 'td'), ref);
    }
    ensureColgroup(table);
};

export const deleteColumn = (table: HTMLTableElement, cell: HTMLTableCellElement): void => {
    const grid = buildGrid(table);
    const pos = cellPosition(grid, cell);
    if (!pos) {
        return;
    }
    const width = Math.max(...grid.map((row) => row.length));
    const span = cell.colSpan || 1;
    if (span >= width) {
        return; // deleting every column is deleting the table — a separate, explicit action
    }
    const c0 = pos.col;
    const c1 = pos.col + span - 1;
    const handled = new Set<HTMLTableCellElement>();
    for (let r = 0; r < grid.length; r++) {
        for (let c = c0; c <= c1; c++) {
            const el = grid[r][c];
            if (!el || handled.has(el)) {
                continue;
            }
            handled.add(el);
            const cp = cellPosition(grid, el)!;
            const overlap = Math.min(cp.col + (el.colSpan || 1) - 1, c1) - Math.max(cp.col, c0) + 1;
            if ((el.colSpan || 1) > overlap) {
                el.colSpan = el.colSpan - overlap;
            } else {
                el.remove();
            }
        }
    }
    const colgroup = table.querySelector(':scope > colgroup');
    if (colgroup) {
        for (let c = c1; c >= c0; c--) {
            colgroup.children[c]?.remove();
        }
    }
};

/**
 * The tight rectangle spanned by two cells, expanded until every cell it
 * touches fits inside completely (merged neighbors drag the rectangle
 * out). Returns the rect plus the unique cells inside it.
 */
export const selectionRect = (
    table: HTMLTableElement,
    a: HTMLTableCellElement,
    b: HTMLTableCellElement
): { r0: number; c0: number; r1: number; c1: number; cells: HTMLTableCellElement[] } | null => {
    const grid = buildGrid(table);
    const pa = cellPosition(grid, a);
    const pb = cellPosition(grid, b);
    if (!pa || !pb) {
        return null;
    }
    let r0 = Math.min(pa.row, pb.row);
    let c0 = Math.min(pa.col, pb.col);
    let r1 = Math.max(pa.row + (a.rowSpan || 1) - 1, pb.row + (b.rowSpan || 1) - 1);
    let c1 = Math.max(pa.col + (a.colSpan || 1) - 1, pb.col + (b.colSpan || 1) - 1);
    let grew = true;
    while (grew) {
        grew = false;
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const el = grid[r]?.[c];
                if (!el) {
                    continue;
                }
                const p = cellPosition(grid, el)!;
                const er1 = p.row + (el.rowSpan || 1) - 1;
                const ec1 = p.col + (el.colSpan || 1) - 1;
                if (p.row < r0 || p.col < c0 || er1 > r1 || ec1 > c1) {
                    r0 = Math.min(r0, p.row);
                    c0 = Math.min(c0, p.col);
                    r1 = Math.max(r1, er1);
                    c1 = Math.max(c1, ec1);
                    grew = true;
                }
            }
        }
    }
    const cells: HTMLTableCellElement[] = [];
    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            const el = grid[r]?.[c];
            if (el && cells.indexOf(el) === -1) {
                cells.push(el);
            }
        }
    }
    return { r0, c0, r1, c1, cells };
};

const isEmptyCell = (cell: HTMLTableCellElement): boolean => {
    const html = cell.innerHTML.trim().toLowerCase();
    return html === '' || html === '<br>' || html === '<p><br></p>';
};

/** Merge every cell between a and b (rectangle-expanded) into one */
export const mergeCells = (table: HTMLTableElement, a: HTMLTableCellElement, b: HTMLTableCellElement): HTMLTableCellElement | null => {
    const rect = selectionRect(table, a, b);
    if (!rect || rect.cells.length < 2) {
        return null;
    }
    const target = rect.cells[0];
    for (const el of rect.cells.slice(1)) {
        if (!isEmptyCell(el)) {
            target.innerHTML = isEmptyCell(target) ? el.innerHTML : target.innerHTML + ' ' + el.innerHTML;
        }
        el.remove();
    }
    target.colSpan = rect.c1 - rect.c0 + 1;
    target.rowSpan = rect.r1 - rect.r0 + 1;
    return target;
};

/** Undo a merge: the cell returns to 1×1 and fillers take the freed grid */
export const splitCell = (table: HTMLTableElement, cell: HTMLTableCellElement): void => {
    const cs = cell.colSpan || 1;
    const rs = cell.rowSpan || 1;
    if (cs === 1 && rs === 1) {
        return;
    }
    const grid = buildGrid(table);
    const pos = cellPosition(grid, cell)!;
    cell.colSpan = 1;
    cell.rowSpan = 1;
    for (let r = pos.row; r < pos.row + rs; r++) {
        const tr = table.rows[r];
        if (!tr) {
            continue;
        }
        let ref: HTMLTableCellElement | null = null;
        for (const cand of Array.from(tr.cells)) {
            if (cand === cell) {
                continue;
            }
            const cp = cellPosition(grid, cand);
            if (cp && cp.col > pos.col) {
                ref = cand;
                break;
            }
        }
        const count = r === pos.row ? cs - 1 : cs;
        for (let i = 0; i < count; i++) {
            tr.insertBefore(filler(cell.tagName), ref);
        }
    }
};

const swapTag = (cell: HTMLTableCellElement, tag: string): HTMLTableCellElement => {
    if (cell.tagName === tag) {
        return cell;
    }
    const next = document.createElement(tag) as HTMLTableCellElement;
    for (const attr of Array.from(cell.attributes)) {
        next.setAttribute(attr.name, attr.value);
    }
    while (cell.firstChild) {
        next.appendChild(cell.firstChild);
    }
    cell.parentElement!.replaceChild(next, cell);
    return next;
};

/** First row th ⇄ td (CKEditor's header row toggle) */
export const toggleHeaderRow = (table: HTMLTableElement): void => {
    const row = table.rows[0];
    if (!row) {
        return;
    }
    const toHeader = row.cells[0]?.tagName !== 'TH';
    for (const cell of Array.from(row.cells)) {
        swapTag(cell, toHeader ? 'TH' : 'TD');
    }
};

/** First column th ⇄ td */
export const toggleHeaderColumn = (table: HTMLTableElement): void => {
    const grid = buildGrid(table);
    const first: HTMLTableCellElement[] = [];
    for (let r = 0; r < grid.length; r++) {
        const el = grid[r][0];
        if (el && first.indexOf(el) === -1) {
            first.push(el);
        }
    }
    const toHeader = first.some((cell) => cell.tagName !== 'TH');
    for (const cell of first) {
        swapTag(cell, toHeader ? 'TH' : 'TD');
    }
};
