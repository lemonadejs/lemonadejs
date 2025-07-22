title: LocalStorage Value Persistence
keywords: LemonadeJS, two-way data binding, frontend, JavaScript library, JavaScript, reactive, React, examples
description: Learn how to integrate a reactive LemonadeJS component with localStorage to persist state values.
canonical: https://lemoandejs.com/docs/examples/value-persistence

# LocalStorage Value Persistence

This example demonstrates a dropdown component with two-way data binding. The selected value is saved to localStorage whenever the dropdown's value changes.

## Example

The value is automatically updated in localStorage whenever the dropdown's selection changes.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { onchange } = lemonade;

function Persistence() {
    // Default value of the property which is bound to the value of the dropdown
    this.language = localStorage.getItem('language');

    // Do something when the self.language changes using the onchange lemonadeJS native tracker
    onchange((prop) => {
        // Persist language
        localStorage.setItem('language', this.language);
    });

    return render => render`<select :bind="${this.language}">
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
import { onchange } from 'lemonadejs';

export default function Persistence() {
    // Default value of the property which is bound to the value of the dropdown
    this.language = localStorage.getItem('language');

    // Do something when the self.language changes using the onchange lemonadeJS native tracker
    onchange((prop) => {
        // Persist language
        localStorage.setItem('language', this.language);
    });

    return render => render`<select :bind="this.language">
        <option value="">Choose one</option>
        <option value="en_GB">English</option>
        <option value="pt_BR">Portuguese</option>
    </select>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-value-persistence-p2hbvf)