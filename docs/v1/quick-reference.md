title: Quick Reference for LemonadeJS v1
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, quick reference
description: A summary of the main concepts, methods and events when using LemonadeJS.

![LemonadeJS quick reference](img/learning.png)

Quick reference
===============

All you need to know in one page

What it is
----------

LemonadeJS is a micro library (Less than 4Kbytes) but still a very powerful library. In this page you can find the most important concept and aspects to learn and start using lemonadejs.

The self object
---------------

The self is a common lemonade object that contains properties and methods that can be invoked from the template making very easy to create highly dynamic elements.  
  

Special properties
------------------

There are three special properties in lemaondeJS, those are:  

*   `@ref:` assign a reference of an HTML tag to property in the JavaScript lemonadejs self object.
*   `@bind:` bind the value of an HTML element to a variable in JavaScript lemonadejs self object and create an onchange event to keep the self property always updated.
*   `@ready:` call a method as soon the element is ready on the DOM.

  

Methods
-------

There are four methods to help to create the lemandejs components as below:  

*   `lemonade.apply(self, DOMElement)` bind a new self to an existing elements in the DOM.
*   `lemonade.template(template, self)` create a new HTML element from a template and make the self available in the template.
*   `lemonade.render(DOMElement, DOMElement)` append a lemanodejs element to an existing DOM element available.
*   `lemonade.blender(template, self, DOMElement)` create a new lemonadejs component based on the template, bind the self to this new element and append that to an existing DOM element.

  

Events
------

There are two native events to help interect with lemonade components as follow:  

*   `self.onload(component)` It happens when the component is ready and mounted.
*   `self.onchange(property, affected)` It happens when a property of the self is changed.

  

Learning examples
-----------------

### Basic examples

*   [BMI Calculation](/docs/v1/examples/bmi-calculation)
*   [Lamp](/docs/v1/examples/lamp)
*   [Event countdown](/docs/v1/examples/event-countdown)
*   [Color Changer](/docs/v1/examples/color-changer)

### Advanced examples

*   [Hangman game](/docs/v1/examples/hangman)
*   [Shopping](/docs/v1/examples/shopping)

  

Extensions using LemonadeJS
---------------------------

*   [Linkedin-style photo uploader and cropper](/docs/plugins/image-cropper "Photo cropper and filters component")