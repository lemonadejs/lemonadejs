/**
 * Official Type definitions for LemonadeJS
 * https://lemonadejs.net
 */

declare function lemonade() : any;

declare namespace lemonade {
    type OnloadFunction = (component: HTMLElement) => void;

    type OnchangeFunction = (property: string, affectedElements: object) => void;

    interface ComponentEvents {
        /**
         * When the component is ready and appended to the DOM
         */
        onload?: OnloadFunction;
        /**
         * When a property used in the template is changed. Properties are tracked only when used in the template.
         */
        onchange?: OnchangeFunction;
    }

    type FunctionComponent = (this: {
        /**
         * Root element of the component
         */
        el: HTMLElement;
        /**
         * Parent component self
         */
        parent: FunctionComponent;
        /**
         * Refresh a property that is an array or the entire component.
         * @param target
         */
        refresh: (target?: string) => void
        [key: string]: any;
    } & ComponentEvents) => void

    class component {
        constructor(s?: Record<string, any>);
        // Root DOM element
        el: HTMLElement;
        // Self which called the child component
        parent: FunctionComponent;
        // Refresh an array or the entire component
        refresh: (target?: string) => void
        [key: string]: any;
    }

    /**
     * Create a LemonadeJS
     * @param {string} template to create the element
     * @param {Object} self object to control the component
     * @param {Object} components that would be used in the template
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    function element(template: String, self: Object, components?: Object) : HTMLElement;

    /**
     * Append a LemonadeJS rendered DOM element to the DOM.
     * @param {Function} component LemonadeJS component
     * @param {HTMLElement} root DOM element container
     * @param {Object} self inject a self object to the renderer
     * @param {string?} template template to be passed to component
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    function render(component: Function, root: HTMLElement, self?: Object, template?: String) : false | Element | Document | DocumentFragment;

    /**
     * Bind a self to an existing appended DOM element
     * @param {HTMLElement} root Existing DOM element
     * @param {Object} self LemonadeJS self controller
     * @param {Object} components that would be used in the template
     */
    function apply(root: HTMLElement, self: Object, components?: Object) : void;

    /**
     * Extract a property from a nested object using a string address
     * @param {string} str address inside the nested object
     * @param {boolean} config get the configuration obj => property
     */
    function path(str: string, config: boolean) : any;

    /**
     * Get an artifact from LemonadeJS Sugar by its alias identification
     * @param {string} alias Existing sugar alias
     * @return {Object|Function} Sugar Artifact
     */
    function get(alias: String) : void;

    /**
     * Set a artifact to LemonadeJS Sugar
     * @param {string} alias Sugar alias identification
     * @param {Object|Function} artifact Object of function to be saved to sugar
     * @param {Boolean} persistence Persist the last call. Only valid when the artifact is a function.
     */
    function set(alias: String, artifact: Function|Object, persistence?: Boolean) : void;

    /**
     * Send an object to a sugar function.
     * @param {string} alias Existing sugar saved on sugar
     * @param {object} argument Object as an argument for the method.
     */
    function dispatch(alias: String, argument: Object) : void;

    /**
     * Add a custom component available across the whole application
     * @param {object} components
     */
    function setComponents(components: Object) : void;
}

export default lemonade;