/**
 * Official Type definitions for LemonadeJS
 * https://lemonadejs.net
 */

declare function lemonade() : any;

declare namespace lemonade {
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
     * @param {Function} LemonadeJS component
     * @param {HTMLElement} DOM element container
     * @param {Object} inject a self object to the renderer
     */
    function render(component: Function, root: HTMLElement, self?: Object) : void;

    /**
     * Bind a self to an existing appended DOM element
     * @param {HTMLElement} Existing DOM element
     * @param {Object} LemonadeJS self controller
     * @param {Object} components that would be used in the template
     */
    function apply(root: HTMLElement, self: Object, components?: Object) : void;

    /**
     * Get an artifact from LemonadeJS Sugar by its alias identification
     * @param {string} Existing sugar alias
     * @return {Object|Function} Sugar Artifact
     */
    function get(alias: String) : void;

    /**
     * Set a artifact to LemonadeJS Sugar
     * @param {string} Sugar alias identification
     * @param {Object|Function} Object of function to be saved to sugar
     * @param {Boolean} Persist the last call. Only valid when the artifact is a function.
     */
    function set(alias: String, artifact: Function|Object, persistence?: Boolean) : void;

    /**
     * Send an object to a sugar function.
     * @param {string} Existing sugar saved on sugar
     * @param {object} Object as an argument for the method.
     */
    function dispatch(alias: String, argument: Object) : void;
}

export = lemonade;