/**
 * <Chart /> pure helpers — axis scales, tick generators, number
 * formatting, colour math, SVG path builders, and the shared polar
 * geometry (viewBox 0 0 100 100, centre 50,50). No DOM, no state.
 */
import type { State } from 'lemonadejs';

/**
 * The shared roving-focus keyboard handler for the mark-based plots
 * (pie/donut, radialbar, polararea, sankey, chord, arc diagram). It
 * mirrors the cartesian column model in cartesian.ts exactly: the
 * arrow keys roam the marks, Home/End jump, Enter/Space activates the
 * current mark, Escape clears. The CONTAINER carries tabindex/role/
 * aria-label — the SVG itself stays aria-hidden, because the focusable
 * element lives outside the hidden subtree.
 */
export const kbKeydown = (kb: State<number | null>, n: number, activate: (i: number) => void) =>
    (e: KeyboardEvent): void => {
        if (!n) return;
        const cur = kb.value != null && kb.value < n ? kb.value : null;
        let next = cur;
        switch (e.key) {
            case 'ArrowRight': case 'ArrowUp': next = cur == null ? 0 : Math.min(n - 1, cur + 1); break;
            case 'ArrowLeft': case 'ArrowDown': next = cur == null ? n - 1 : Math.max(0, cur - 1); break;
            case 'Home': next = 0; break;
            case 'End': next = n - 1; break;
            case 'Enter': case ' ':
                if (cur != null) activate(cur);
                e.preventDefault();
                return;
            case 'Escape': kb.value = null; return;
            default: return;
        }
        e.preventDefault();
        kb.value = next;
    };

/** A "nice" number near `x` (1/2/5 × 10^n); `round` snaps to nearest vs ceils. */
const niceNum = (x: number, round: boolean): number => {
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    const nf = round
        ? f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10
        : f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
};

/**
 * A readable axis covering [min, max] with round tick steps, including a zero
 * baseline when the data crosses it. Returns the bounds + descending ticks.
 */
export const niceScale = (min: number, max: number, count = 4): { lo: number; hi: number; ticks: number[] } => {
    if (min > 0) min = 0;          // bars always include the zero baseline
    if (max < 0) max = 0;
    if (min === max) max = min + 1; // avoid a zero-height range
    const step = niceNum((max - min) / count, true);
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = hi; v >= lo - step * 1e-6; v -= step) ticks.push(Math.round(v / step) * step);
    return { lo, hi, ticks };
};

/** Compact, readable number: 1.2k, 3.4M, 1.1B; integers stay whole. */
export const compact = (n: number, dec?: number | null): string => {
    const abs = Math.abs(n);
    const unit = (v: number, s: string): string => {
        if (dec != null) return v.toFixed(dec) + s;
        const r = Math.round(v * 10) / 10;
        return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + s;
    };
    if (abs >= 1e9) return unit(n / 1e9, 'B');
    if (abs >= 1e6) return unit(n / 1e6, 'M');
    if (abs >= 1e3) return unit(n / 1e3, 'k');
    if (dec != null) return n.toFixed(dec);
    return String(Math.round(n * 100) / 100); // trim float noise
};

/** Interpolate two hex colours (heatmap scale). */
const hexRgb = (h: string): number[] => {
    const s = h.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2) || '0', 16));
};
export const lerpColor = (a: string, b: string, t: number): string => {
    const A = hexRgb(a);
    const B = hexRgb(b);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
};

/** Readable text colour (dark/white) for a solid `rgb()`/hex background. */
export const textOn = (bg: string): string => {
    const c = /^#/.test(bg) ? hexRgb(bg) : (bg.match(/\d+/g) || [255, 255, 255]).map(Number);
    const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    return lum > 150 ? '#2b2f36' : '#ffffff';
};

/** A laid-out tile in 0..100 percentage coordinates. */
export interface TreeRect { x: number; y: number; w: number; h: number; i: number; }
/**
 * Squarified treemap layout (Bruls/Huizing/van Wijk): pack `values` into the
 * rect [X,Y,W,H] as rows chosen to keep tile aspect ratios near 1. Returns
 * one rect per input index (zero/negative values are dropped).
 */
export const squarify = (values: number[], X: number, Y: number, W: number, H: number): TreeRect[] => {
    const idx = values.map((v, i) => ({ v: Math.max(0, v), i })).filter((o) => o.v > 0);
    const total = idx.reduce((s, o) => s + o.v, 0);
    const out: TreeRect[] = [];
    if (total <= 0 || W <= 0 || H <= 0) return out;
    const scale = (W * H) / total;
    const areas = idx.map((o) => ({ a: o.v * scale, i: o.i }));
    let x = X; let y = Y; let w = W; let h = H;
    const worst = (row: number[], side: number): number => {
        const s = row.reduce((a, b) => a + b, 0);
        const mx = Math.max(...row); const mn = Math.min(...row);
        const s2 = s * s; const side2 = side * side;
        return Math.max((side2 * mx) / s2, s2 / (side2 * mn));
    };
    let k = 0;
    while (k < areas.length) {
        const side = Math.min(w, h);
        let row: number[] = [];
        let j = k;
        while (j < areas.length) {
            const next = [...row, areas[j].a];
            if (row.length && worst(next, side) > worst(row, side)) break;
            row = next; j++;
        }
        const rowSum = row.reduce((a, b) => a + b, 0);
        if (w >= h) {
            const colW = rowSum / h;
            let cy = y;
            for (let r = 0; r < row.length; r++) { const rh = row[r] / colW; out.push({ x, y: cy, w: colW, h: rh, i: areas[k + r].i }); cy += rh; }
            x += colW; w -= colW;
        } else {
            const rowH = rowSum / w;
            let cx = x;
            for (let r = 0; r < row.length; r++) { const rw = row[r] / rowH; out.push({ x: cx, y, w: rw, h: rowH, i: areas[k + r].i }); cx += rw; }
            y += rowH; h -= rowH;
        }
        k = j;
    }
    return out;
};

/** Full number with optional fixed decimals + thousands grouping (1,234.5). */
export const plain = (n: number, dec: number | null | undefined, group: boolean): string => {
    const fixed = dec != null ? n.toFixed(dec) : String(Math.round(n * 1000) / 1000);
    if (!group) return fixed;
    const neg = fixed.startsWith('-');
    const body = neg ? fixed.slice(1) : fixed;
    const [int, frac] = body.split('.');
    const g = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + (frac ? g + '.' + frac : g);
};

/** A nice axis spanning [min,max] WITHOUT forcing zero (for scatter x/y). */
export const niceExtent = (min: number, max: number, count = 5): { lo: number; hi: number; ticks: number[] } => {
    if (min === max) { min -= 0.5; max += 0.5; }
    const step = niceNum((max - min) / count, true);
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Math.round(v / step) * step);
    return { lo, hi, ticks };
};

/** Parse an x value: timestamp (datetime) or number (linear). */
export const parseX = (c: unknown, type: string): number => {
    if (typeof c === 'number') return c;
    if (type === 'linear') { const n = Number(c); return Number.isFinite(n) ? n : NaN; }
    const t = Date.parse(String(c));
    return Number.isFinite(t) ? t : NaN;
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n: number): string => (n < 10 ? '0' + n : String(n));

/** Default datetime label for a timestamp at a given granularity. */
const fmtDate = (t: number, mode: 'time' | 'md' | 'mon' | 'year'): string => {
    const d = new Date(t);
    if (mode === 'time') return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    if (mode === 'md') return MON[d.getMonth()] + ' ' + d.getDate();
    if (mode === 'mon') return MON[d.getMonth()] + ' ' + d.getFullYear();
    return String(d.getFullYear());
};

/** Smart time ticks: pick a granularity by span and place ticks on boundaries. */
export const timeTicks = (min: number, max: number, target = 6): Array<{ v: number; label: string }> => {
    const span = max - min || 1;
    const day = 86400000;
    const out: Array<{ v: number; label: string }> = [];
    if (span <= 2 * day) {
        const opts = [3600000, 2 * 3600000, 3 * 3600000, 6 * 3600000, 12 * 3600000, day];
        const step = opts.find((s) => span / s <= target) || day;
        for (let t = Math.ceil(min / step) * step; t <= max; t += step) out.push({ v: t, label: fmtDate(t, 'time') });
    } else if (span <= 70 * day) {
        const stepDays = Math.max(1, Math.round(span / day / target));
        const d0 = new Date(min); d0.setHours(0, 0, 0, 0);
        for (let t = d0.getTime(); t <= max; t += stepDays * day) if (t >= min) out.push({ v: t, label: fmtDate(t, 'md') });
    } else if (span <= 2 * 365 * day) {
        const stepM = Math.max(1, Math.round(span / day / 30 / target));
        for (let d = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1);
            d.getTime() <= max; d = new Date(d.getFullYear(), d.getMonth() + stepM, 1)) {
            if (d.getTime() >= min) out.push({ v: d.getTime(), label: fmtDate(d.getTime(), 'mon') });
        }
    } else {
        const stepY = Math.max(1, Math.round(span / day / 365 / target));
        for (let d = new Date(new Date(min).getFullYear(), 0, 1);
            d.getTime() <= max; d = new Date(d.getFullYear() + stepY, 0, 1)) {
            if (d.getTime() >= min) out.push({ v: d.getTime(), label: fmtDate(d.getTime(), 'year') });
        }
    }
    return out;
};

/** A "nice" scale forced to exactly `K` intervals (used to align dual axes). */
export const fixedScale = (min: number, max: number, K: number): { lo: number; hi: number; ticks: number[] } => {
    if (min > 0) min = 0;
    if (max < 0) max = 0;
    if (min === max) max = min + 1;
    let step = niceNum((max - min) / K, true);
    let lo = Math.floor(min / step) * step;
    if (lo + step * K < max - step * 1e-6) step = niceNum((max - lo) / K, false);
    lo = Math.floor(min / step) * step;
    const hi = lo + step * K;
    const ticks: number[] = [];
    for (let i = K; i >= 0; i--) ticks.push(Math.round((lo + step * i) / step) * step);
    return { lo, hi, ticks };
};

/** Straight-segment path through points ([x,y] in viewBox units). */
export const polyPath = (pts: Array<[number, number]>): string =>
    pts.map((p, i) => (i ? 'L ' : 'M ') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');

/** Step path: hold each value, then jump (stairs). `mid` steps at the midpoint. */
export const stepPath = (pts: Array<[number, number]>, mid: boolean): string => {
    if (pts.length < 2) return polyPath(pts);
    let d = 'M ' + pts[0][0].toFixed(2) + ',' + pts[0][1].toFixed(2);
    for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        if (mid) {
            const xm = (x0 + x1) / 2;
            d += ' L ' + xm.toFixed(2) + ',' + y0.toFixed(2) + ' L ' + xm.toFixed(2) + ',' + y1.toFixed(2) + ' L ' + x1.toFixed(2) + ',' + y1.toFixed(2);
        } else {
            d += ' L ' + x1.toFixed(2) + ',' + y0.toFixed(2) + ' L ' + x1.toFixed(2) + ',' + y1.toFixed(2);
        }
    }
    return d;
};

/** Smooth (Catmull-Rom → cubic bezier) path through points. */
export const smoothPath = (pts: Array<[number, number]>): string => {
    if (pts.length < 3) return polyPath(pts);
    let d = 'M ' + pts[0][0].toFixed(2) + ',' + pts[0][1].toFixed(2);
    const t = 0.16;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) * t;
        const c1y = p1[1] + (p2[1] - p0[1]) * t;
        const c2x = p2[0] - (p3[0] - p1[0]) * t;
        const c2y = p2[1] - (p3[1] - p1[1]) * t;
        d += ' C ' + c1x.toFixed(2) + ',' + c1y.toFixed(2) + ' ' +
            c2x.toFixed(2) + ',' + c2y.toFixed(2) + ' ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2);
    }
    return d;
};

/* ------------------------------------------------------------------ *
 *  Pie geometry (SVG viewBox 0 0 100 100, centre 50,50)              *
 * ------------------------------------------------------------------ */

export const R = 49; // leave a 1-unit hairline so the stroke is not clipped

/** Point on a circle of radius `r`, 0° at the top, clockwise. */
export const polar = (angle: number, r = R): [number, number] => {
    const a = ((angle - 90) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
};

export const f = (n: number): string => n.toFixed(3);

/** SVG path for a solid wedge between two angles (degrees). */
export const wedge = (start: number, end: number): string => {
    const [x1, y1] = polar(end);
    const [x2, y2] = polar(start);
    const large = end - start <= 180 ? 0 : 1;
    return `M 50 50 L ${f(x1)} ${f(y1)} A ${R} ${R} 0 ${large} 0 ${f(x2)} ${f(y2)} Z`;
};

/** SVG path for an annular (donut) segment between two angles. */
export const ring = (start: number, end: number, rInner: number): string => {
    const [ox1, oy1] = polar(end);
    const [ox2, oy2] = polar(start);
    const [ix1, iy1] = polar(start, rInner);
    const [ix2, iy2] = polar(end, rInner);
    const large = end - start <= 180 ? 0 : 1;
    return `M ${f(ox1)} ${f(oy1)} A ${R} ${R} 0 ${large} 0 ${f(ox2)} ${f(oy2)} ` +
        `L ${f(ix1)} ${f(iy1)} A ${rInner} ${rInner} 0 ${large} 1 ${f(ix2)} ${f(iy2)} Z`;
};

/**
 * Ring segment with rounded corners (the donut `borderradius`). `q` is the
 * corner radius in viewBox units, clamped to the half-thickness and to the
 * slice's angular room so tiny slices degrade to plain ring segments.
 */
export const roundedRing = (start: number, end: number, rOut: number, rIn: number, q: number): string => {
    const span = end - start;
    q = Math.max(0, Math.min(q, (rOut - rIn) / 2));
    const halfRad = Math.min(Math.PI / 2, (span / 2) * (Math.PI / 180));
    q = Math.min(q, (rIn * Math.sin(halfRad)) / (1 + Math.sin(halfRad)) || 0);
    const rco = rOut - q; // corner-centre radii
    const rci = rIn + q;
    const fo = (Math.asin(Math.min(1, q / rco)) * 180) / Math.PI; // corner angular size
    const fi = (Math.asin(Math.min(1, q / rci)) * 180) / Math.PI;
    if (q < 0.05 || span <= 2 * Math.max(fo, fi) + 0.2) return ring(start, end, rIn);
    const to = Math.sqrt(rco * rco - q * q); // tangent radius on the edge lines
    const ti = Math.sqrt(rci * rci - q * q);
    const P = (a: number, r: number): string => { const [x, y] = polar(a, r); return f(x) + ' ' + f(y); };
    const cr = f(q) + ' ' + f(q) + ' 0 0 1 ';
    return 'M ' + P(start + fo, rOut) +
        ' A ' + f(rOut) + ' ' + f(rOut) + ' 0 ' + (span - 2 * fo > 180 ? 1 : 0) + ' 1 ' + P(end - fo, rOut) +
        ' A ' + cr + P(end, to) +
        ' L ' + P(end, ti) +
        ' A ' + cr + P(end - fi, rIn) +
        ' A ' + f(rIn) + ' ' + f(rIn) + ' 0 ' + (span - 2 * fi > 180 ? 1 : 0) + ' 0 ' + P(start + fi, rIn) +
        ' A ' + cr + P(start, ti) +
        ' L ' + P(start, to) +
        ' A ' + cr + P(start + fo, rOut) + ' Z';
};

/** A full annulus (single-slice donut) via even-odd fill of two circles. */
export const fullRing = (rInner: number): string =>
    `M 50 ${f(50 - R)} A ${R} ${R} 0 1 1 50 ${f(50 + R)} A ${R} ${R} 0 1 1 50 ${f(50 - R)} Z ` +
    `M 50 ${f(50 - rInner)} A ${rInner} ${rInner} 0 1 0 50 ${f(50 + rInner)} ` +
    `A ${rInner} ${rInner} 0 1 0 50 ${f(50 - rInner)} Z`;

/** Annular sector between two angles at arbitrary radii (ring() with both radii free). */
export const sector = (start: number, end: number, rOut: number, rIn: number): string => {
    const [ox1, oy1] = polar(end, rOut);
    const [ox2, oy2] = polar(start, rOut);
    const [ix1, iy1] = polar(start, rIn);
    const [ix2, iy2] = polar(end, rIn);
    const large = end - start <= 180 ? 0 : 1;
    return `M ${f(ox1)} ${f(oy1)} A ${f(rOut)} ${f(rOut)} 0 ${large} 0 ${f(ox2)} ${f(oy2)} ` +
        `L ${f(ix1)} ${f(iy1)} A ${f(rIn)} ${f(rIn)} 0 ${large} 1 ${f(ix2)} ${f(iy2)} Z`;
};

/** A full annulus at arbitrary radii via even-odd fill of two circles. */
export const annulus = (rOut: number, rIn: number): string =>
    `M 50 ${f(50 - rOut)} A ${f(rOut)} ${f(rOut)} 0 1 1 50 ${f(50 + rOut)} A ${f(rOut)} ${f(rOut)} 0 1 1 50 ${f(50 - rOut)} Z ` +
    `M 50 ${f(50 - rIn)} A ${f(rIn)} ${f(rIn)} 0 1 0 50 ${f(50 + rIn)} A ${f(rIn)} ${f(rIn)} 0 1 0 50 ${f(50 - rIn)} Z`;
