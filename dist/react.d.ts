/**
 * LemonadeJS v6 — React adapter (lemonadejs/react)
 *
 * One generic adapter replaces every per-plugin shim. Everything is
 * derived from the contract:
 *
 *   import { adaptReact } from 'lemonadejs/react';
 *   export default adaptReact(Switch);
 *
 *   <Switch value={on} onChange={setOn} label="Dark mode" ref={api} />
 *
 *   - declared props become states the adapter owns; React re-renders
 *     diff prop values into them (live updates, no remount)
 *   - bind maps to React's value/onChange convention (lowercase onchange
 *     also accepted — our casing rule applies on our side, theirs on theirs)
 *   - declared events call the latest React callback (no stale closures)
 *   - the declared api is exposed through the React ref:
 *     ref.current.toggle()
 *   - StrictMode-safe: unmount is idempotent, mounting is effect-scoped
 *
 * Components without a contract still adapt: props are passed once as a
 * snapshot (mount-time), like v5.
 */
import type { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';
import type { Component } from './types';
type AnyProps = Record<string, unknown>;
type Api = Record<string, (...args: unknown[]) => unknown>;
export declare const adaptReact: (target: Component<never>) => ForwardRefExoticComponent<PropsWithoutRef<AnyProps> & RefAttributes<Api>>;
export default adaptReact;
