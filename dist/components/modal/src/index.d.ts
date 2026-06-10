/**
 * <Modal /> — the platform primitive. Floating panels, dropdown lists,
 * autocomplete, corner chats and the context menu are all built on these
 * behaviors, ported faithfully from v5:
 *
 *   - resize from all 8 edges/corners (10px hit zone) with live cursor
 *     feedback; Shift preserves the aspect ratio
 *   - drag by the top 40px zone with a move cursor — improved over v5:
 *     the grab zone is CLAMPED to the viewport, a modal can never be
 *     dragged irrecoverably off-screen
 *   - minimize DOCKS to a taskbar row at the bottom of the screen
 *     (205px slots, wrapping), restore returns to the remembered spot
 *   - explicit coordinates on open (centered unless positioned), margin
 *     based auto-adjust, responsive fullscreen on small screens
 *   - Escape/focus handling scoped to the ELEMENT (multiple modals never
 *     fight over a document listener), v5 close origins preserved
 *
 * v5 → v6 mapping: closed → bind (inverted: bind is the OPEN state);
 * auto-close → autoclose; auto-adjust → autoadjust; content → children.
 * onclose(origin): 'button' | 'backdrop' | 'escape' | 'focusout' | 'api'.
 * onmove(top, left) and onresize(width, height) fire on release.
 */
export declare const Modal: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    bind: BooleanConstructor;
    title: string;
    width: number;
    height: number;
    top: number;
    left: number;
    position: string;
    backdrop: boolean;
    closable: boolean;
    draggable: boolean;
    resizable: boolean;
    minimizable: boolean;
    minimized: boolean;
    fullscreen: boolean;
    header: boolean;
    autoclose: boolean;
    autoadjust: boolean;
    focus: boolean;
    overflow: boolean;
    responsive: boolean;
    layers: boolean;
    url: string;
    onopen: FunctionConstructor;
    onclose: FunctionConstructor;
    onmove: FunctionConstructor;
    onresize: FunctionConstructor;
    api: {
        open: FunctionConstructor;
        close: FunctionConstructor;
        toggle: FunctionConstructor;
        front: FunctionConstructor;
        back: FunctionConstructor;
    };
}>>;
export default Modal;
