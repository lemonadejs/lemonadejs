/**
 * Trendlines: the least-squares fits Excel offers (linear, exponential,
 * logarithmic, power, polynomial) and the moving average. Pure math.
 */

export interface TrendOptions {
    type?: 'linear' | 'exponential' | 'logarithmic' | 'power' | 'polynomial' | 'movingAverage';
    /** polynomial: the degree (2–6, default 2) */
    order?: number;
    /** movingAverage: the window (default 2) */
    period?: number;
    /** curves: the number of segments drawn (default 40) */
    samples?: number;
}

/** y = a + b x */
const linear = (xs: number[], ys: number[]): [number, number] | null => {
    const n = xs.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
        sx += xs[i];
        sy += ys[i];
        sxx += xs[i] * xs[i];
        sxy += xs[i] * ys[i];
    }
    const d = n * sxx - sx * sx;
    if (!d) return null;
    const b = (n * sxy - sx * sy) / d;
    return [(sy - b * sx) / n, b];
};

/** y = c0 + c1 x + … + ck x^k: the normal equations, Gaussian elimination with partial pivoting */
const polynomial = (xs: number[], ys: number[], order: number): number[] | null => {
    const m = order + 1;
    const A: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
    const B = new Array<number>(m).fill(0);
    for (let i = 0; i < xs.length; i++) {
        const pw = [1];
        for (let k = 1; k < 2 * m - 1; k++) pw.push(pw[k - 1] * xs[i]);
        for (let r = 0; r < m; r++) {
            B[r] += pw[r] * ys[i];
            for (let c = 0; c < m; c++) A[r][c] += pw[r + c];
        }
    }
    for (let c = 0; c < m; c++) {
        let p = c;
        for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        if (!A[p][c]) return null;
        [A[c], A[p]] = [A[p], A[c]];
        [B[c], B[p]] = [B[p], B[c]];
        for (let r = c + 1; r < m; r++) {
            const f = A[r][c] / A[c][c];
            for (let k = c; k < m; k++) A[r][k] -= f * A[c][k];
            B[r] -= f * B[c];
        }
    }
    const coef = new Array<number>(m);
    for (let r = m - 1; r >= 0; r--) {
        let s = B[r];
        for (let k = r + 1; k < m; k++) s -= A[r][k] * coef[k];
        coef[r] = s / A[r][r];
    }
    return coef;
};

const positive = (v: number): boolean => v > 0;

/**
 * The trendline of `points` as [x, y] pairs across their x range, or null
 * when they cannot be fitted: fewer than two points, or non-positive
 * values where a logarithm is taken.
 */
export const fit = (points: Array<{ x: number; y: number }>, options: TrendOptions = {}): Array<[number, number]> | null => {
    const type = options.type || 'linear';
    const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((a, b) => a.x - b.x);

    if (type === 'movingAverage') {
        const period = Math.max(2, Math.round(options.period || 0) || 2);
        const out: Array<[number, number]> = [];
        for (let i = period - 1; i < pts.length; i++) {
            let s = 0;
            for (let k = i - period + 1; k <= i; k++) s += pts[k].y;
            out.push([pts[i].x, s / period]);
        }
        return out.length ? out : null;
    }

    if (pts.length < 2) return null;

    // exponential, logarithmic and power are a linear fit in log space
    const logX = type === 'logarithmic' || type === 'power';
    const logY = type === 'exponential' || type === 'power';
    let xs = pts.map((p) => p.x);
    let ys = pts.map((p) => p.y);
    if ((logX && !xs.every(positive)) || (logY && !ys.every(positive))) return null;
    if (logX) xs = xs.map(Math.log);
    if (logY) ys = ys.map(Math.log);

    let f: (x: number) => number;
    if (type === 'polynomial') {
        const coef = polynomial(xs, ys, Math.min(6, Math.max(2, Math.round(options.order || 0) || 2)));
        if (!coef) return null;
        f = (x) => {
            let s = 0;
            for (let k = coef.length - 1; k >= 0; k--) s = s * x + coef[k];
            return s;
        };
    } else {
        const c = linear(xs, ys);
        if (!c) return null;
        f = (x) => c[0] + c[1] * x;
    }

    const y = (x: number): number => {
        const v = f(logX ? Math.log(x) : x);
        return logY ? Math.exp(v) : v;
    };

    // a straight line needs its two ends; curves are sampled
    const x0 = pts[0].x;
    const x1 = pts[pts.length - 1].x;
    const samples = type === 'linear' ? 1 : options.samples || 40;
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= samples; i++) {
        const x = x0 + ((x1 - x0) * i) / samples;
        out.push([x, y(x)]);
    }
    return out;
};

/** Excel's box: min, the quartiles by the exclusive median method, max. */
export const quartiles = (values: number[]): [number, number, number, number, number] | null => {
    const v = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    if (!v.length) return null;
    const median = (a: number[]): number => {
        const mid = Math.floor(a.length / 2);
        return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
    };
    const half = Math.floor(v.length / 2);
    return [v[0], median(v.slice(0, half)), median(v), median(v.slice(v.length - half)), v[v.length - 1]];
};
