/**
 * Official Type definitions for LemonadeJS
 * https://lemonadejs.net
 *
 * @module lemonadejs
 */

// HTML extensions for LemonadeJS attributes
/* Uncomment if needed
declare global {
    interface HTMLElement {
        ':ref'?: string;
        ':bind'?: string;
        ':data'?: string;
        ':click'?: string;
        ':keydown'?: string;
        ':keyup'?: string;
        ':change'?: string;
        ':checked'?: string;
        ':selected'?: string;
        ':value'?: string;
        [key: `:${string}`]: string | undefined;
    }
}
*/

// Core types
export type OnloadFunction<T extends HTMLElement> = (element: T) => void;
export type OnchangeFunction<T> = (prop: string, newValue: T, oldValue: T) => void;
export type State<T> = { value: T };
export type StateCallback<T> = (newValue: T, oldValue: T) => void;

// Render types
export type RenderTemplate = (strings: TemplateStringsArray, ...values: any[]) => HTMLElement;

// Component types
export interface ComponentThis {
    [key: string]: any;
}

export type FunctionComponent = {
    (this: ComponentThis): (render: RenderTemplate) => HTMLElement;
    prototype: any;
}

export interface ComponentClass {
    new (props?: Record<string, any>): {
        el: HTMLElement;
        refresh: (target?: string) => void;
        [key: string]: any;
    };
}

export type Component = FunctionComponent | ComponentClass | (() => string);

export interface WebComponentOptions {
    /** Create the web component inside a shadowRoot */
    shadowRoot?: boolean,
    /** Apply-only will apply the LemonadeJS self component on the existing HTML inside the tag already in the DOM */
    applyOnly?: boolean,
    /** Web component prefix name. Default: 'lm' */
    prefix?: string,
}

/**
 * Create a LemonadeJS element
 * @param {string} template to create the element
 * @param {Object} self object to control the component
 * @param {Object} components that would be used in the template
 * @return {HTMLElement} Result DOM element, ready to be append to the DOM
 */
export const element: (template: string, self: Object, components?: Object) => HTMLElement;

/**
 * Append a LemonadeJS rendered DOM element to the DOM.
 * @param {Component} component LemonadeJS component
 * @param {HTMLElement} root DOM element container
 * @param {Object} self inject a self object to the renderer
 * @param {string?} template template to be passed to component
 * @return {HTMLElement} Result DOM element, ready to be append to the DOM
 */
export const render: (
    component: Component,
    root: HTMLElement,
    self?: Object,
    template?: string
) => false | Element | Document | DocumentFragment;

/**
 * Bind a self to an existing appended DOM element
 * @param {HTMLElement} root Existing DOM element
 * @param {Object} self LemonadeJS self controller
 * @param {Object} components that would be used in the template
 */
export const apply: (root: HTMLElement, self: Object, components?: Object) => void;

/**
 * Extract a property from a nested object using a string address
 * @param {string} str address inside the nested object
 * @param {boolean} config get the configuration obj => property
 */
export const path: (str: string, config: boolean) => any;

/**
 * Register a callback to be executed when component is loaded
 * @param callback Function to be called with root element when component loads
 */
export const onload: (method: OnloadFunction<HTMLElement>) => void;

/**
 * Register a method to track property changes
 * @param callback Function to be called when properties change
 */
export const onchange: <T>(method: OnchangeFunction<T>) => void;

/**
 * Force onchange when a property change value
 * @param {string} prop Property name
 */
export const track: (prop: string) => void;

/**
 * Create a reactive state container
 * @param value Initial value
 * @param callback Optional callback function when value changes
 */
export const state: <T>(value: T, callback?: StateCallback<T>) => State<T>;

/**
 * Add a custom component available across the whole application
 * @param {object} components
 */
export const setComponents: (components: Record<string, Component>) => void;

/**
 * Get an artifact from LemonadeJS Sugar by its alias identification
 * @param {string} alias Existing sugar alias
 * @return {Object|Function} Sugar Artifact
 */
export const get: (alias: string) => any;

/**
 * Set an artifact to LemonadeJS Sugar
 * @param {string} alias Sugar alias identification
 * @param {Object|Function} artifact Object or function to be saved to sugar
 * @param {Boolean} persistence Persist the last call. Only valid when the artifact is a function.
 */
export const set: (alias: string, artifact: Function | Object, persistence?: boolean) => void;

/**
 * Send an object to a sugar function.
 * @param {string} alias Existing sugar saved on sugar
 * @param {object?} argument Object as an argument for the method.
 */
export const dispatch: (alias: string, argument?: Object) => any;

/**
 * Create a web component
 * @param {string} name New web component name. LemonadeJS includes a prefix of lm- so your final tag will be <lm-yourname>
 * @param {function} handler LemonadeJS component
 * @param {object?} options Options for your web component
 */
export const createWebComponent: (name: string, handler: Component, options?: WebComponentOptions) => any;

/**
 * Create a reactive state with a path setter function
 * @param {Object} initialData Initial object data
 * @param {Function} callback Optional callback function when data changes
 * @return {[Object, Function, Function]} Returns a tuple with the state object, a setter function, a getter function with filtered data by visibility
 */
export const setPath: <T extends Record<string, any>>(
    initialData: T, 
    callback?: () => void
  ) => [T, (updates: Partial<T>) => void, () => T];

// Define the default export for better IDE integration
declare const lemonade: {
    element: typeof element;
    render: typeof render;
    apply: typeof apply;
    path: typeof path;
    onload: typeof onload;
    onchange: typeof onchange;
    track: typeof track;
    state: typeof state;
    setPath: typeof setPath;
    setComponents: typeof setComponents;
    get: typeof get;
    set: typeof set;
    dispatch: typeof dispatch;
    createWebComponent: typeof createWebComponent;
};

export default lemonade;
