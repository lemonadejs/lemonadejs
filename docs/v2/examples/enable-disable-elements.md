title: Enable and disable HTML elements
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples, table, enabled and disable HTML elements
description: How to enable or disable HTML elements.

Enable/disabled HTML elements
=============================

The simpler way to enable or disabled HTML elements  
  

Example
-------

  

[See this example on jsfiddle](https://jsfiddle.net/spreadsheet/kurcx8a2/)

  

### Source code

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
function App() {
    let self = {};
    self.disabled= false;
    let template = `<>
        <input type="button" onclick="self.disabled = !self.disabled" value="{{!self.disabled?'Disable':'Enabled'}}" />
        <input type="text" disabled="{{self.disabled}}" />
    </>`;

    return lemonade.element(template, self);
}

lemonade.render(App, document.getElementById('root'));
</script>
</html>
```