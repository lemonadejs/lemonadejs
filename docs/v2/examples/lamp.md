title: Lamp
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: A simple state change example using LemonadeJS.

Lamp
====

A LemonadeJS self property can be bound to an HTML DOM element attribute, in this sense the attribute will be automatically updated when the self property value changes.  
  

A working example
-----------------

  

### Source code

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>

<div id='root'></div>

<script>
var Lamp = (function() {
    var self = {
        state: 'off',
    }

    var template = `
        <>
            <img src="{{'/templates/default/img/example-lamp-' + self.state + '.jpg'}}"><br/>
            <button onclick="self.state = 'on'">Light on</button>
            <button onclick="self.state = 'off'">Light off</button>
        </>`;

    return lemonade.element(template, self);
});

lemonade.render(Lamp, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-reactive-library-update-attributes-74g67)