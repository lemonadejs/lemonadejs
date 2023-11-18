title: Mastering LemonadeJS JavaScript Methods,
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, methods,
description: Learn the fundamental LemonadeJS methods to create powerful and dynamic JavaScript components for your web applications.

LemonadeJS methods
==================

  

Summary
-------

The following table lists the native LemonadeJS methods.  

| Method | Description |
| --- | --- |
| **Core functions** |     |
| element(string, object, object) | It will create the DOM elements based on an HTML template and bind the scope with the self object.  <br>`lemonade.element(template: String, self: Object, components: Object) => DOMElement` |
| render(DOMElement, DOMElement, object?) | It will append the newly created LemonadeJS DOM elements to a root given.  <br>`lemonade.render(component: Function, root: HTMLElement, self?: object, template?: HTMLElement) => DOMElement` |
| apply(DOMElement, object, object) | Bind the self scope to an existing DOMElement already in the DOM.  <br>`lemonade.apply(root: HTMLElement, self: Object, components: Object) => void` |
| setComponents(object) | Add component references to be used across the whole application.  <br>`lemonade.setComponents(components: object) => void` |
| **Sugar functions** |     |
| set(string, self, persistence) | Make the self or a data dispatcher available in the Sugar common container to be used across different components.  <br>`lemonade.set(alias: String, self: Object, persistence?: Boolean) => void` |
| get(string) | Get a self reference from the Sugar common container.  <br>`lemonade.get(alias: String) => Object \| Function` |
| dispatch(string, data) | Call a data dispatcher.  <br>`lemonade.dispatch(alias: String, data: Object) => void` |

  
  

Methods
-------

  

### lemonade.element

- The `lemonade.element` renders a HTML string and bind a self data object its DOM elements.  
  
  

### lemonade.render

- The `lemonade.render` runs a component or class and bind the result to a existing DOM element.  
  
  

### lemonade.apply

- The `lemonade.apply` will be used when you wish to bind a self to an existing appended DOM element. That is useful to apply a self to an existing application without changing the application.  

  
## Examples

### Basic JavaScript Example

The following examples are basic examples on how to apply a self to an existing DOM root element. Of course this is just an example for education purposes and a better scope encapsulation should be considered.  
  

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>

<div id='root'>
    <p><strong>{{self.title}}</strong></p>
    <input type="button" value="Update"
        onclick="self.title = 'New title'" />
</div>

<script>
// Apply the self object to an existing HTML element already in the DOM
let self = {};
self.title = 'Hello world';
lemonade.apply(document.getElementById('root'), self);
</script>
</html>
```

#### Control an existing HTML form

The following example binds a self to an HTML form to control the values of the form elements.  
  

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>

<form id='root'>
    <div class='form-group'>
        <label>Name</label>
        <input type='text' name='name' :bind="self.name">
    </div>

    <div class='form-group'>
        <label>Profession</label>
        <input type='text' name='profession' :bind="self.profession">
    </div>

    <div class='form-group'>
        <label>Gender</label>
        <select name='gender' :bind="self.gender">
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
lemonade.apply(document.getElementById('root'), self);
</script>
</html>
```

  
  

Conclusion
----------

You can use `lemonade.render` and `lemonade.element` to create components, or use `lemonade.apply` to bind a self to a block of HTML code.  

&nbsp;

[Next chapter: Native lemonade JavaScript events](/docs/v3/events){.button .main}

