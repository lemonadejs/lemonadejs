title: Reactive HTML forms
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: A simple example of a reactive HTML form using LemonadeJS.

Two way binding
===============

Overview
--------

Lemonadejs brings two-way binding natively. Each change in the property of a `self` would be applied to the correspondend elements in the view.

```html
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

lemonade.render(myComponent, document.getElementById('root'));
</script>
</html>
```