title: LemonadeJS Quick Reference
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, quick reference, documentation
description: A summary of the main LemonadeJS concepts, methods and events and other important aspects. All you need to learn in one page.

![LemonadeJS quick reference](img/quick-reference.svg)

Quick reference
===============

All you need to know in a single page.

  

What it is?
-----------

LemonadeJS is a micro reactive library (About 7 KBytes). It has a syntax close to vanilla JavaScript and offers a quick learning curve. This page brings a summary of the most important concepts.  

### Pico Extensions

A LemonadeJS Pico component implements common application requirements and should have a limit of 1.8 KBytes and zero dependencies. That is a challenge that promotes highly optimized solutions for modern applications. The official pico components are:

*   [List](/docs/plugins/list): (1.5 KBytes): helps to convert an array of objects in a list of objects, with search and pagination.
*   [Rating](/docs/plugins/rating): (1.5 KBytes): reactive star rating implementation
*   [Router](/docs/plugins/router): (1.8 KBytes): render your components based on routes. Very useful to create single page applications.
*   [Signature](/docs/plugins/signature): (1.5 KBytes): a optimized implementation of a javascript signature pad.

  
Send you suggestion on our [github page](https://github.com/lemonadejs/lemonadejs) or by email contact@lemonadejs.net  
  
  

The self object
---------------

The self is the LemonadeJS object that contains all properties and methods that will be used in the template. When a self property is included in the template, an automatic observation is created. That will help to deliver highly dynamic components. The methods available in the self can be invoked from the template and it would be the best way to enhance the communication between the HTML and the JavaScript.  
  

### Special self attributes

*   `el`: a reference to the root element of each component. Only available when the component is ready.
*   `parent`: when a component is called from another component. This property contains the self object of the caller.
*   `refresh`: trigger the changes from a self property to the view. It is used to refresh the view when a array is changed or to refresh a whole component.

  
  
  

Attributes
----------

There are four special properties in LemonadeJS, those are:  

*   `@ref:` assign a reference of an HTML tag to property in the JavaScript LemonadeJS self object.
*   `@bind:` bind the value of an HTML element to a variable in JavaScript LemonadeJS self object and create an onchange event to keep the self property always updated.
*   `@ready:` call a method as soon the element is ready on the DOM.
*   `@loop:` It receives an array in a custom element. It will call the custom element for each position in the array.

  
  

Methods
-------

There are three main methods to help to create the LemonadeJS components as below:  

*   `lemonade.apply(DOMElement, self, components)` bind a new self to an existing elements in the DOM.
*   `lemonade.element(template, self, components)` create a new HTML element from a template and make the self available in the template.
*   `lemonade.render(DOMElement, DOMElement)` append a LemonadeJS element to an existing DOM element available.

  
  

Events
------

There are two native events that can be create within the `self` as follow:  

*   `self.onload(component)` It happens when the component is ready and mounted.
*   `self.onchange(property, affected)` It happens when a property of the self is changed.

  

### The event object

The JavaScript event (e) can be declared on the HTML tag attributes `<div onclick="self.test(e);">test</div>`  
  
  
  

Learning examples
-----------------

  

### Basic examples

*   [Lamp](/docs/v2/examples/lamp)
*   [Counter](/docs/v2/examples/counter)
*   [Color generator](/docs/v2/examples/color-generator)
*   [Value persistence](/docs/v2/examples/value-persistence)
*   [DIV onresize](/docs/v2/examples/div-onresize)
*   [Star rating](/docs/v2/examples/rating)
*   [Table](/docs/v2/examples/table)

### Advanced examples

*   [Hangman game](/docs/v2/examples/hangman)
*   [Tictactoe](/docs/v2/examples/tictactoe)

  
  

Extensions using LemonadeJS
---------------------------

*   [Linkedin-style photo uploader and cropper](/docs/v2/plugins/image-cropper "Photo cropper and filters component")