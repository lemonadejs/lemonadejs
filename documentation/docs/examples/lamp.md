title: Reactive Example with LemonadeJS v5
keywords: LemonadeJS, two-way data binding, frontend, JavaScript library, JavaScript, reactive, examples
description: Learn how to create a simple state change using LemonadeJS Version 5.
canonical: https://lemonadejs.com/docs/examples/lamp

# Lamp

LemonadeJS supports dynamic property strings to automatically update the UI when a property changes.  

## A working example
  
```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Lamp() {
    this.value = 'on'

    return render => render`<div>
        <img src="https://lemonadejs.com/templates/default/img/example-lamp-{{this.value}}.jpg">
        <br/>
        <input type="button" onclick="${() => this.value = 'on'}" value="Light on" />
        <input type="button" onclick="${() => this.value = 'off'}" value="Light off" />
    </div>`;
}
lemonade.render(Lamp, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Lamp() {
    this.value = 'on'

    return render => render`<div>
        <img src="https://lemonadejs.com/templates/default/img/example-lamp-{{this.value}}.jpg">
        <br/>
        <input type="button" onclick="${() => this.value = 'on'}" value="Light on" />
        <input type="button" onclick="${() => this.value = 'off'}" value="Light off" />
    </div>`;
}
```
  
[See this example on codesandbox](https://codesandbox.io/s/reactive-javascript-library-83xmr7)