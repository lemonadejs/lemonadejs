title: Reactive Lamp
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: A simple state change example using LemonadeJS.

Lamp
====

A LemonadeJS `self` property value will be synchronized with the HTML attribute.  
  

A working example
-----------------
 
  

### Source code

  
```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
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
        <img src="https://lemonadejs.net/templates/default/img/example-lamp-{{self.state?'on':'off'}}.jpg">
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
        <img src="https://lemonadejs.net/templates/default/img/example-lamp-{{self.state?'on':'off'}}.jpg">
        <br/>
        <input type="button" onclick="self.on" value="Light on" />
        <input type="button" onclick="self.off" value="Light off" />
    </div>`;
}
```

  
[See this example on codesandbox](https://codesandbox.io/s/reactive-javascript-library-83xmr7)