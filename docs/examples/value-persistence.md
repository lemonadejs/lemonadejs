title: Value persistence,
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: Integrate a reactive LemonadeJS component with the JavaScript localStorage to persist a state value.

Local value persistence
=======================

The following example shows a two-way binding dropdown with an event to save its value on the localStorage.  
  

Example
-------

The value is updated on the localStorage on the dropdown changes its value.  
  

  
  

### Source code


```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Persistence() {
    const self = this;

    // Default value of the property which is bound to the value of the dropdown
    self.language = localStorage.getItem('language');

    // Do something when the self.language changes using the onchange lemonadeJS native tracker
    self.onchange = function() {
        // Persist language
        localStorage.setItem('language', self.language);
    }

    return `<select :bind="self.language">
        <option value="">Choose one</option>
        <option value="en_GB">English</option>
        <option value="pt_BR">Portuguese</option>
    </select>`;
}
lemonade.render(Persistence, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Persistence() {
    const self = this;

    // Default value of the property which is bound to the value of the dropdown
    self.language = localStorage.getItem('language');

    // Do something when the self.language changes using the onchange lemonadeJS native tracker
    self.onchange = function() {
        // Persist language
        localStorage.setItem('language', self.language);
        console.log(localStorage.getItem('language'))
    }

    return `<select :bind="self.language">
        <option value="">Choose one</option>
        <option value="en_GB">English</option>
        <option value="pt_BR">Portuguese</option>
    </select>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-value-persistence-p2hbvf)