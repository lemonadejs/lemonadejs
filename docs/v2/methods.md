title: JavaScript Methods
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, methods
description: Understanding the basic LemonadeJS methods that would help you to create amazing javascript components.

LemonadeJS Methods
==================

The following table lists the native LemonadeJS methods.  

| Method | Description                                                                                                                                                                                                      |
| --- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Core functions** |
| element(string, object, object) | It will create the DOM elements based on a HTML template and bind the scope with the self object and return a DOM Element container. `lemonade.element(template: String, self: Object, components: Object) => DOMElement` |
| render(DOMElement, DOMElement) | It will append the new created LemonadeJS DOMElement to a DOMElement in the existing DOM. `lemonade.render(component: Function, root: HTMLElement) => void`                                                      |
| apply(DOMElement, object, object) | Bind the self scope to an existing DOMElement already in the DOM. `lemonade.apply(root: HTMLElement, self: Object, components: Object) => void`                                                                  |
| **Sugar functions** |
| set(string, self, persistence) | Make the self or a data dispatcher available in the Sugar common container to be used across different components. `lemonade.set(alias: String, self: Object, persistence?: Boolean) => void`                    |
| get(string) | Get a self reference from the Sugar common container. `lemonade.get(alias: String) => Object                                                                                                                     | Function` |
| dispatch(string, data) | Call a data dispatcher. `lemonade.dispatch(alias: String, data: Object) => void`                                                                                                                                 |

Apply method
------------

In almost all examples through the website you can see that the `lemonade.element` creates render the HTML and binds with the self. Them the `lemonade.render` will append that element to the DOM. The `lemonade.apply` will be used when you wish to bind a self to an existing appended DOM element. Thus it would be use to bind a existing self to the already appended DOM element.  

### Basic Example

The following examples are basic examples on how to apply a self to an existing DOM root element. Of course this is just an example for education purposes and a better scope encapsulation should be considered.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>

<div id='root'>
    <h1>{{self.title}}</h1>
    <input type="button" value="Update"
        onclick="self.title = 'New title'" />
</div>

<script>
// Apply the self object to an existing HTML element already in the DOM
var self = {};
self.title = 'Hello world';
lemonade.apply(document.getElementById('root'), self);
</script>
</html>
```
==============

  
  

### Control an existing HTML form

The following example binds a self to an HTML form to control the values of the form elements.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>

<form id='myForm'>
    <div class='form-group'>
        <label>Name</label><br>
        <input type='text' name='name' @bind="self.name">
    </div>

    <div class='form-group'>
        <label>Profession</label>
        <input type='text' name='profession' @bind="self.name">
    </div>

    <div class='form-group'>
        <label>Gender</label>
        <select name='gender' @bind="self.gender">
            <option value="1">Male</option>
            <option value="2">Female</option>
        </select>
    </div>

    <div class='form-group'>
        <input type='button' value='Save profile' onClick='self.save()'>
    </div>
</form>

<script>
// Apply the self object to an existing HTML element already in the DOM
let self = {};
self.name = 'John Lennon';
self.profession = 'Musician';
self.gender = 1;
self.save = function() {
    alert('Do something...');
}
lemonade.apply(document.getElementById('myForm'), self);
</script>
</html>
```
  

Conclusion
----------

You can use `lemonade.render` and `lemonade.element` to create components, or use `lemonade.apply` to bind a self to a block of HTML code.  

Next chapter: [Native lemonade JavaScript events](/docs/v2/events)