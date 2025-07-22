title: JavaScript Reactive Lamp Example with LemonadeJS v4
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: How to create a simple state change using LemonadeJS version 4.

Lamp
====

A LemonadeJS `self` property value will be synchronized with the HTML attribute.  
  

A working example
-----------------
 
  

### Source code

  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Lamp() {
    const self = this;
    
    self.on = () => {
        self.state = 1;
    }

    self.off = () => {
        self.state = 0;
    }
    
    return `<>
        <img src="https://lemonadejs.com/templates/default/img/example-lamp-{{self.state?'on':'off'}}.jpg">
        <br/>
        <input type="button" onclick="self.on" value="Light on" />
        <input type="button" onclick="self.off" value="Light off" />
    </>`;
}
lemonade.render(Lamp, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Lamp() {
    const self = this;

    self.on = () => {
        self.state = 1;
    }

    self.off = () => {
        self.state = 0;
    }
    
    return `<div>
        <img src="https://lemonadejs.com/templates/default/img/example-lamp-{{self.state?'on':'off'}}.jpg">
        <br/>
        <input type="button" onclick="self.on" value="Light on" />
        <input type="button" onclick="self.off" value="Light off" />
    </div>`;
}
```

  
[See this example on codesandbox](https://codesandbox.io/s/reactive-javascript-library-83xmr7)