title: LemonadeJS Quick Reference: Essential Concepts & Features,
keywords: LemonadeJS, quick reference, frontend, javascript library, reactive, react, documentation,
description: Explore the essential LemonadeJS concepts, features, and techniques in this concise, quick reference guide, designed to help you master LemonadeJS faster.

![JavaScript library documentation](img/quick-reference.svg)

Quick reference
===============

All you need to know in a single page.

  

What it is?
-----------

LemonadeJS is a micro-reactive JavaScript library (About 7 KBytes). It has a syntax close to vanilla JavaScript and offers a quick learning curve. This page brings a summary of the most important concepts.  
  
  

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

There are a few methods to create and manage the LemonadeJS components.  
    
| Method | Description |
| --- | --- |
| **Core functions** |     |
| element(string, object, object) | It will create the DOM elements based on an HTML template and bind the scope with the self object.  <br>`lemonade.element(template: String, self: Object, components: Object) => DOMElement` |
| render(DOMElement, DOMElement, object?) | It will append the newly created LemonadeJS DOM elements to a root given.  <br>`lemonade.render(component: Function, root: HTMLElement, self?: object) => DOMElement` |
| apply(DOMElement, object, object) | Bind the self scope to an existing DOMElement already in the DOM.  <br>`lemonade.apply(root: HTMLElement, self: Object, components: Object) => void` |
| setComponents(object) | Add component references to be used across the whole application.  <br>`lemonade.setComponents(components: object) => void` |
| **Sugar functions** |     |
| set(string, self, persistence) | Make the self or a data dispatcher available in the Sugar common container to be used across different components.  <br>`lemonade.set(alias: String, self: Object, persistence?: Boolean) => void` |
| get(string) | Get a self reference from the Sugar common container.  <br>`lemonade.get(alias: String) => Object \| Function` |
| dispatch(string, data) | Call a data dispatcher.  <br>`lemonade.dispatch(alias: String, data: Object) => void` |
 
  

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
  
[https://lemonadejs.net/docs/tests](/docs/v3/tests)  
  
  
  

Learning examples
-----------------

  

### Basic examples

*   [Lamp](/docs/v3/examples/lamp)
*   [Counter](/docs/v3/examples/counter)
*   [Color generator](/docs/v3/examples/color-generator)
*   [Value persistence](/docs/v3/examples/value-persistence)
*   [DIV onresize](/docs/v3/examples/div-onresize)
*   [Star rating](/docs/v3/examples/rating)
*   [Table](/docs/v3/examples/table)

  

### Advanced examples

*   [Hangman game](/docs/v3/examples/hangman)
*   [Tic-tac-toc game](/docs/v3/examples/tic-tac-toe)

  
  
  

Pico Extensions
---------------

A LemonadeJS Pico component implements common application requirements and should have a limit of 1.8 KBytes and zero dependencies. That is a challenge that promotes highly optimized solutions for modern applications. The official pico components are:

*   [List](/docs/plugins/list): (1.5 KBytes): helps to convert an array of objects in a list of objects, with search and pagination.
*   [Rating](/docs/plugins/rating): (1.5 KBytes): reactive star rating implementation
*   [Router](/docs/plugins/router): (1.8 KBytes): render your components based on routes. Very useful to create single page applications.
*   [Signature](/docs/plugins/signature): (1.5 KBytes): a optimized implementation of a javascript signature pad.

  
  

Extensions using LemonadeJS
---------------------------

*   [Linkedin-style photo uploader and cropper](/docs/plugins/image-cropper "Photo cropper and filters component")

  
Send you suggestion on our [github page](https://github.com/lemonadejs/lemonadejs) or by email contact@jspreadsheet.com