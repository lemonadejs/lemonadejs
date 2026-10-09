/** The trendline fits and the box quartiles: pure math, no DOM. */
import { describe, it, expect } from 'vitest';
import { fit, quartiles } from './src/trend';

const close = (a: number, b: number, eps = 1e-6): void => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('components/charts trend', () => {
    it('linear: recovers y = 2x + 1 as its two ends', () => {
        const line = fit([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 9 }], { type: 'linear' })!;
        expect(line.length).toBe(2);
        close(line[0][0], 1); close(line[0][1], 3);
        close(line[1][0], 4); close(line[1][1], 9);
    });

    it('linear: a least-squares fit of noisy points', () => {
        // y = x with one outlier: the fit passes through the mean (2.5, 2.75)
        const line = fit([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 5 }], { type: 'linear' })!;
        const slope = (line[1][1] - line[0][1]) / (line[1][0] - line[0][0]);
        close(slope, 1.3);
        close(line[0][1] + slope * 1.5, 2.75);
    });

    it('sorts the points by x and ignores non-numeric ones', () => {
        const line = fit([{ x: 3, y: 7 }, { x: 1, y: 3 }, { x: NaN, y: 1 }, { x: 2, y: NaN }], { type: 'linear' })!;
        close(line[0][0], 1); close(line[1][0], 3);
    });

    it('exponential, logarithmic and power: recover their curves', () => {
        const exp = fit([1, 2, 3, 4, 5].map((x) => ({ x, y: 2 * Math.exp(0.5 * x) })), { type: 'exponential' })!;
        expect(exp.length).toBe(41);
        close(exp[40][1], 2 * Math.exp(2.5));
        const log = fit([1, 2, 4, 8].map((x) => ({ x, y: 3 + 2 * Math.log(x) })), { type: 'logarithmic', samples: 2 })!;
        close(log[2][1], 3 + 2 * Math.log(8));
        const pow = fit([1, 2, 3, 4].map((x) => ({ x, y: 3 * Math.pow(x, 2) })), { type: 'power', samples: 3 })!;
        close(pow[3][1], 48);
    });

    it('polynomial: recovers y = x^2 - 3x + 2 with order 2', () => {
        const line = fit([0, 1, 2, 3, 4, 5].map((x) => ({ x, y: x * x - 3 * x + 2 })), { type: 'polynomial', order: 2, samples: 5 })!;
        line.forEach(([x, y]) => close(y, x * x - 3 * x + 2));
    });

    it('moving average: one point per window', () => {
        expect(fit([1, 2, 3, 4].map((x) => ({ x, y: x * 10 })), { type: 'movingAverage', period: 2 })).toEqual([[2, 15], [3, 25], [4, 35]]);
    });

    it('returns null when the data cannot be fitted', () => {
        expect(fit([{ x: 1, y: 1 }], { type: 'linear' })).toBeNull();
        expect(fit([{ x: 1, y: 1 }, { x: 1, y: 2 }], { type: 'linear' })).toBeNull();
        expect(fit([{ x: 0, y: 1 }, { x: 1, y: 2 }], { type: 'logarithmic' })).toBeNull();
        expect(fit([{ x: 1, y: -1 }, { x: 2, y: 2 }], { type: 'exponential' })).toBeNull();
        expect(fit([{ x: 1, y: 1 }], { type: 'movingAverage', period: 2 })).toBeNull();
    });

    it('quartiles: Excel exclusive median method', () => {
        expect(quartiles([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([1, 2.5, 4.5, 6.5, 8]);
        expect(quartiles([5, 1, 3])).toEqual([1, 1, 3, 5, 5]);
        expect(quartiles([])).toBeNull();
    });
});
