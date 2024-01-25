title: Two-way data binding | LemonadeJS v1
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript
description: Two-way data binding helps the information sharing between the JavaScript and the view and vice versa.

Two way data binding
====================

Two-way binding facilitates the information sharing between a JavaScript variable and an HTML element and vice verse. The natural way is for example binding an onchange event to a element form to update a JS Variable, them when changing the variable applying that back to the HTML form. When dealing with several element forms that would escalate to a very time consume job to create and maintain.

The _Lemonadejs_ brings two-way binding natively, so for each update in the property of a `self` would be applied to the correspondend elements in the view and vice verse.

A very common usage is when the developer needs the values of element forms back to the self. That can be easily archivable using events for the elements in the form, for example:

```html
<input type='text' name='email' value='roger@rabbit.com' onchange='self.email = this.value'>

<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var myComponent = (function() {
    var self = {};
    self.name = 'Roger Rabbit';
    self.valid = true;

    var template = `<div>
        <div>Name: {{self.name}}</div>
        <div>Checked: {{self.valid}}</div><br/>
        <label>
            <input type="text" value="1" @bind="self.name" />
        </label>
        <label>
            <input type="checkbox" value="1" @bind="self.valid" />
            Test
        </label>
    </div>`;

    return lemonade.element(template, self);
});

lemonadejs.render(myComponent, document.getElementById('root'));
</script>
</html>
```