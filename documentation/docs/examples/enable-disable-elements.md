title: Disabled form elements with LemonadeJS
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples, disable attribute
description: How to easily toggle the disable attribute on HTML form elements using LemonadeJS.

# Disable Elements

LemonadeJS provides a simple way to control the disabled property of HTML elements using state.
  
[See this example on jsfiddle](https://jsfiddle.net/spreadsheet/mh2d6w8f/)


```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;

function Component() {
    let disabled = state(true);
    const toggle = () => {
        disabled.value = ! disabled.value;
    }
    return render => render`<div>
        <input type="text" disabled="${disabled}" value="test..." />
        <input type="button" onclick="${toggle}" value="Toggle" />
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Component() {
    let disabled = state(true);
    const toggle = () => {
        disabled.value = ! disabled.value;
    }
    return render => render`<div>
        <input type="text" disabled="${disabled}" value="test..." />
        <input type="button" onclick="${toggle}" value="Toggle" />
    </div>`;
}
```
