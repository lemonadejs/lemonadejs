title: Reactive HTML forms with LemonadeJS v1
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, HTML forms
description: How to create amazing interactive HTML forms using LemonadeJS.

![Two way data binding with LemonadeJS](img/forms.png)

HTML form elements
==================

As presented in previous chapters in this documentation, the @bind property will allow archive the two-way binding in a very straightforward manner, linking an HTML element to a property within the lemonadejs self. This page will present examples of the behavior in different native HTML elements.  
  

Input and textarea
------------------

The most simple application would be with the input and textarea where the onchange event will update the bound self property, and when updating the self property update back the value of the HTML element.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var Input = (function() {
    var template = `<div>
        <h1>{{self.text}}</h1>
        <input @bind='self.text' /></div>
    `;
    return lemonade.element(template, self);
});
lemonade.render(Input, document.getElementById('root'));
</script>
</html>
```

### Example

The text should update with the onchange event

  
  

Checkbox
--------

The checkbox is working very similarly to the example above. It should keep the state of the checkbox in the self property designated.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var Checkbox = (function() {
    var self = {};
    self.email = true;
    self.phone = true;
    self.letter = true;
    var template = `<div>
            <h1>{{self.email}}, {{self.phone}}, {{self.letter}}</h1>
            <fieldset>
                <legend>Contact options</legend>
                <label><input type='checkbox' @bind='self.email' /> Email</label>
                <label><input type='checkbox' @bind='self.phone' /> Phone</label>
                <label><input type='checkbox' @bind='self.letter' /> Letter</label>
            </fieldset>
        </div>
    `;
    return lemonade.element(template, self);
});
lemonade.render(Checkbox, document.getElementById('root'));
</script>
</html>
```

### Example

The text should update with the onchange event

  
  

Radio
-----

On radios the self attribute should be the same to can keep the value from the selected radio, as below:  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var Radio = (function() {
    var self = {};
    self.favorite = 'Pears';
    var template = `<div>
            <fieldset>
                <legend>Favorite fruit</legend>
                <label><input type='radio' name='favorite' value='Apples' @bind='self.favorite' /> Apples</label>
                <label><input type='radio' name='favorite' value='Pears' @bind='self.favorite' /> Pears</label>
                <label><input type='radio' name='favorite' value='Oranges' @bind='self.favorite' /> Oranges</label>
            </fieldset>
            <input type='button' onclick="alert(self.favorite)" value='Get' />
            <input type='button' onclick="self.favorite = 'Oranges'" value='Set (Oranges)' />
        </div>
    `;
    return lemonade.element(template, self);
});
lemonade.render(Radio, document.getElementById('root'));
</script>
</html>
```

### Example

  
  

Multiple select
---------------

The multiple select has a different handler from other HTML elements. That is because a multiple select updates a array that holds the multiple value options. That means for would be necessary to call the refresher bound to the array, as below.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
(function(root) {
    var self = {};
    self.options = ['Ringo','John'];
    var template = `
        <h1>{{self.options}}</h1>
        <select @bind='self.options' multiple='multiple' size='10'>
        <option>Paul</option>
        <option>Ringo</option>
        <option>John</option>
        <option>George</option>
        </select>
        <button onclick="self.options = ['Ringo']; self.options.refresh()">
            Update the options and refresh
        <button>`;

    lemonade.blender.element(template, self, root);
})(document.getElementById('root'));
</script>
</html>
```

### Example