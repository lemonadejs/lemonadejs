title: LemonadeJS Quick Reference
keywords: LemonadeJS, quick reference, frontend development, JavaScript library, reactive programming, documentation, UI components
description: Access a concise and comprehensive one-page quick reference that encapsulates the essentials of LemonadeJS.

LemonadeJS Quick Reference Guide
===============

Your compact companion for mastering LemonadeJS, this guide offers an overview of the library's core features, best practices, and syntax, all designed to streamline your front-end development workflow.

Understanding LemonadeJS
-----------

At approximately 7 KB, LemonadeJS is a sleek, micro-reactive JavaScript library that's big on features yet small in size. Its familiar syntax, mirroring vanilla JavaScript, simplifies the transition for developers and accelerates the adoption process. Here, we distill the most critical concepts into a digestible summary, giving you the knowledge you need to get started swiftly.  
  
### The template
  
A distinctive aspect of LemonadeJS that sets it apart from other frameworks is its approach to updating the user interface in response to state changes. LemonadeJS constructs segments of the DOM using JavaScript's template literals. This process goes beyond substituting placeholders like `{{self.test}}` within the template. It also establishes a monitoring system that dynamically updates these specific interface elements as the properties change. This mechanism applies to content and DOM attributes, as seen in `<div title="{{self.title}}">test</div>`, for instance.

This efficient system ensures that only the elements with modified data are refreshed, avoiding the overhead of re-rendering the entire component. This optimization significantly improves performance and user experience by reducing processing time and enhancing interactivity.



### The self object

The self is an object that contains all the properties and methods used in the template. An automatic observer helps to keep the HTML according to the `{self}` states. The methods are available from the template, which is excellent for creating verbose and reactive applications.  
  




#### Special self attributes

*   `el`: a reference to the root element of each component. Only available when the component is ready.
*   `parent`: when a component is called from another component. This property contains the self object of the caller.
*   `refresh`: trigger the changes from a self property to the view. It is used to refresh the view when a array is changed or to refresh a whole component.

  
  

Attributes
----------

There are a few special attributes you can use in LemonadeJS, those are:  

*   `:ref` add a property in the self that keeps a reference to the DOM element.
*   `:bind` is used to create a two-way binding between a tag and the specified {self} property.
*   `:ready` defines a method call when the element is ready and appended to the DOM.
*   `:loop` is an attribute to render an array of objects into the DOM.
  
  

Methods
-------

There are a few methods to create, declare and render the LemonadeJS components.

### Core functions

The core methods are instrumental in crafting, declaring, and presenting elements within the DOM.

| Method                                  | Description                                                                                                                                                                    |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| element(string, object, object)         | Generates DOM elements from an HTML string and binds them to a `self` object. Syntax: `lemonade.element(template: String, self: Object, components: Object) => DOMElement`     |
| render(DOMElement, DOMElement, object?) | Attaches LemonadeJS components to a specified DOM root. Syntax: `lemonade.render(component: Function, root: HTMLElement, self?: object, template?: HTMLElement) => DOMElement` |
| apply(DOMElement, object, object)       | Associates a 'self' scope with an existing DOM element. Syntax: `lemonade.apply(root: HTMLElement, self: Object, components: Object) => void` |
| setComponents(object)                   | Includes component references for global application use. Syntax: `lemonade.setComponents(components: object) => void`                                                         |


### Sugar functions

The sugar methods facilitate seamless communication across various components. These methods provide the foundation and communication channels necessary for creating dynamic and interactive web components with LemonadeJS.

| Method                         | Description                                                                                                                                                                          |
|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| set(string, self, persistence) | Shares a 'self' or a data dispatcher within the Sugar common container for component-wide access. Syntax: `lemonade.set(alias: String, self: Object, persistence?: Boolean) => void` |
| get(string)                    | Retrieves a 'self' reference from the Sugar container. Syntax: `lemonade.get(alias: String) => Object                                                                                | Function` |
| dispatch(string, data)         | Initiates a data dispatcher. Syntax: `lemonade.dispatch(alias: String, data: Object) => void`                                                                                        |



Events
------

Two native events are available within the `{self}` as follow:  

*   `self.onload(component)` It happens when the component is ready and mounted.
*   `self.onchange(property, affected)` occurs when a property of the self is changed.

  

### The event object

The JavaScript event (e) is available on the HTML tag attributes `<div onclick="self.test(e);">test</div>`  
  
  
  

Testing
-------

Create unit tests for your LemonadeJS components.  
  
[https://lemonadejs.com/docs/tests](/docs/tests)  
  
  
  

Learning examples
-----------------

  

### Basic examples

*   [Lamp](/docs/examples/lamp)
*   [Counter](/docs/examples/counter)
*   [Color generator](/docs/examples/color-generator)
*   [Value persistence](/docs/examples/value-persistence)
*   [DIV onresize](/docs/examples/div-onresize)
*   [Star rating](/docs/examples/rating)
*   [Table](/docs/examples/table)

  

### Advanced examples

*   [Hangman game](/docs/examples/hangman)
*   [Tic-tac-toc game](/docs/examples/tic-tac-toe)

  
  
  

Pico Extensions
---------------

A LemonadeJS Pico component implements common application requirements and should have a limit of 1.8 KBytes and zero dependencies. That is a challenge that promotes highly optimized solutions for modern applications. The official pico components are:

*   [List](/docs/plugins/list): (1.5 KBytes): helps to convert an array of objects in a list of objects, with search and pagination.
*   [Rating](/docs/plugins/rating): (1.5 KBytes): reactive star rating implementation
*   [Router](/docs/plugins/router): (1.8 KBytes): render your components based on routes. Very useful to create single page applications.
*   [Signature](/docs/plugins/signature): (1.5 KBytes): a optimized implementation of a javascript signature pad.

  
  

Extensions using LemonadeJS
---------------------------

*   [Linkedin-style photo uploader and cropper](/docs/plugins/image-cropper)

  
Send you suggestion on our [github page](https://github.com/lemonadejs/lemonadejs) or by email contact@jspreadsheet.com