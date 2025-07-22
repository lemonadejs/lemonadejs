title: Disabled form elements with LemonadeJS
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples, disable attribute
description: How to easily toggle the disable attribute on HTML form elements using LemonadeJS.

Disable attribute in HTML elements
==================================

LemonadeJS provides a simple way to control the disabled property of HTML elements.  
  

Example
-------

  

[See this example on jsfiddle](https://jsfiddle.net/spreadsheet/mh2d6w8f/)

  

### Source code

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const self = this;
    self.disabled = true;
    self.toggle = () => {
        self.disabled = !self.disabled;
    }
    return `<>
        <input type="text" :disabled="self.disabled" value="test..." />
        <input type="button" onclick="self.toggle" value="Toggle" />
    </>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const self = this;
    self.disabled = true;
    self.toggle = () => {
        self.disabled = !self.disabled;
    }
    return `<>
        <input type="text" :disabled="self.disabled" value="test..." />
        <input type="button" onclick="self.toggle" value="Toggle" />
    </>`;
}
```