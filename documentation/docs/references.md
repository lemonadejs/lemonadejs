title: Dynamic References in LemonadeJS
keywords: LemonadeJS, dynamic references, DOM access, JavaScript, frontend development, reactive programming, reusable components
description: Use the ref attribute in LemonadeJS to directly access DOM elements or components for interaction and updates.
canonical: https://lemonadejs.com/docs/references

# References

The ref attribute provides direct access to DOM elements or components within your template. References can be created using `:ref`{.highlight} or `lm-ref`{.highlight}, allowing you to interact with these elements from your component logic.

## Reference to a DOM element

The `DOM references` enable direct interaction with specific elements or component instances, making tasks like style manipulation, event handling, and dynamic updates straightforward and efficient.

### Reference as a Function

The ref attribute can be assigned a function, providing enhanced flexibility and control over element references. This method is especially useful for dynamically handling elements or managing references as local variables.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { onload } = lemonade;
function Component() {
    let ref = null;

    onload(() => {
        ref.style.color = 'red';
    });

    return render => render`<div :ref="${e => ref = e}">Hello World</div>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
```
```javascript
import { onload } from 'lemonadejs';

export default function Component() {
    let ref = null;

    onload(() => {
        ref.style.color = 'red';
    });

    return render => render`<div :ref="${e => ref = e}">Hello World</div>`;
}
```

### Reference as a Component Property

Alternatively, you can create a reference to an element by binding a property from the component's `this`{.highlight} object to the element's ref attribute.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Test() {
    this.onload = () => {
        this.input.value = 123;
    }

    return render => render`<input type="text" :ref="${this.input}" />`
}

lemonade.render(Test, document.getElementById('root'));
</script>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    this.onload = () => {
        this.input.value = 123;
    }

    return render => render`<input type="text" :ref="${this.input}" />`
}
```

### Root Element References

The root element of a LemonadeJS component is its outermost DOM container. If the component's template contains a single root element, LemonadeJS automatically assigns it to this.el. However, this reference is unavailable when the root is a document fragment.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Test() {
    this.onload = () => {
        this.el.textContent  = 'Hello World';
    }

    return render => render`<div></div>`;
}

lemonade.render(Test, document.getElementById('root'));
</script>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    this.onload = () => {
        this.el.textContent  = 'Hello World';
    }

    return render => render`<div></div>`;
}
```

## References to a Component

Create a reference to the child component can expand the possibility of creating dynamic components since store access to all the properties of the child.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Hello() {
    this.title = 'Hello World';
    return render => render`<p>${this.title}</p>`;
}

lemonade.setComponents({ Hello });
    
function Component() {

    let component;

    const update = () => {
        component.title = 'New child title';
    }

    return render => render`<div>
        <Hello :ref="${(e) => component = e}" />
        <input type="button" value="Update" onclick="${update}">
    </div>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
```
```javascript
function Hello() {
    // Default property
    this.title = 'Hello World';
    // Component template
    return render => render`<p>${this.title}</p>`;
}

lemonade.setComponents({ Hello });

export default function Component() {
    let component;

    const update = () => {
        component.title = 'New child title';
    }

    return render => render`<div>
        <Hello :ref="${(e) => component = e}" />
        <input type="button" value="Update" onclick="${update}">
    </div>`;
}
```

### What's Next?

Learn about the ready attribute, which enables actions when an element is fully initialized.

- [Ready Attribute](/docs/ready)

