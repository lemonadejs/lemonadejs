

Disable attribute in HTML elements
==================================

LemonadeJS provides a simple way to control the disabled property of HTML elements.  
  

Example
-------

  

[See this example on jsfiddle](https://jsfiddle.net/spreadsheet/mh2d6w8f/)

  

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
        <input type="text" :disabled="self.disabled" />
    </>`;

        return lemonade.element(template, self);
    }

    lemonade.render(App, document.getElementById('root'));
</script>
</html>
```

```javascript
import lemonade from 'lemonadejs';

export default function App() {
    const self = this;
    self.disabled = true;
    return `<>
        <input type="button" onclick="self.disabled = !self.disabled" value="{{!self.disabled?'Disable':'Enabled'}}" />
        <input type="text" :disabled="self.disabled" value="test..." />
    </>`;
}
```