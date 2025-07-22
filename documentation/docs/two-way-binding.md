title: Two-Way Data Binding  
keywords: LemonadeJS, two-way data binding, frontend, javascript library, reactive, React, VueJS, AngularJS  
description:  Two-way data binding real-time synchronization between JavaScript and views using LemonadeJS.
canonical: https://lemonadejs.com/docs/two-way-data-binding

# Two-way Data Binding

`Two-way data binding` is a technique that synchronizes a JavaScript variable with its corresponding HTML element value, allowing updates to flow automatically in both directions. LemonadeJS implements two-way data binding using the `bind` attribute declared using the `:`{.highlight} prefix or the `lm-`{.highlight} attribute as follow:

## Examples

The examples below demonstrate using the `bind`{.highlight} attribute with different DOM elements.

### Input Text Binding

The `bind` attribute establishes micro-events synchronising component properties with real-time input values.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Input() {
    // Property to be tracked
    this.input = 'Reactive';
    // Update property
    const update = () => {
        this.input = 'New value';
    }
    // Template
    return render => render`<div>
        <p>${this.input}</p>
        <input type='text' :bind='self.input' />
        <input type='button' value='Update' onclick=${update} />
    </div>`
}

lemonade.render(Input, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Input() {
    // Property to be tracked
    this.input = 'Reactive';
    // Update property
    const update = () => {
        this.input = 'New value';
    }
    // Template
    return render => render`<div>
        <p>${this.input}</p>
        <input type='text' lm-bind='self.input' />
        <input type='button' value='Update' onclick=${update} />
    </div>`
}
```

[See this example on codesandbox](https://codesandbox.io/s/two-way-data-binding-example-jq5doq)



### Checkbox Binding

Checkboxes work similarly, with their state synchronized to the associated component property.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Checkbox() {
    // Default value
    this.email = true;
    // Component template
    return render => render`<div>
        <p>Value: ${this.email}</p>
        <label><input type='checkbox' :bind='self.email'/> Email is a valid option</label>
    </div>`;
}
lemonade.render(Checkbox, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Checkbox() {
    // Default value
    this.email = true;
    // Component template
    return render => render`<div>
        <p>Value: ${this.email}</p>
        <label><input type='checkbox' :bind='self.email'/> Email is a valid option</label>
    </div>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/two-way-data-binding-with-checkboxes-wefr6u)


### Radio

When using radio buttons, bind the same component property to all radio elements to ensure it reflects the currently selected value.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Radio() {
    // Default option
    this.favorite = 'Pears';

    return render => render`<div>
        <p>What is your favorite fruit?</p>
        <label>
            <input type='radio' name='favorite'
                value='Apples' :bind='${this.favorite}' />
            Apples
        </label>
        <label>
            <input type='radio' name='favorite'
                value='Pears' :bind='${this.favorite}' />
            Pears
        </label>
        <label>
            <input type='radio' name='favorite'
                value='Oranges' :bind='${this.favorite}' />
            Oranges
        </label>
        <p>
            <input type='button' onclick="${() => alert(this.favorite)}" value='Get' />
            <input type='button' onclick="${() => this.favorite = 'Oranges'}" value='Set (Oranges)' />
        </p>
    </div>`;
}
lemonade.render(Radio, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Radio() {
    // Default option
    this.favorite = 'Pears';

    return render => render`<div>
        <p>What is your favorite fruit?</p>
        <label>
            <input type='radio' name='favorite'
                value='Apples' :bind='${this.favorite}' />
            Apples
        </label>
        <label>
            <input type='radio' name='favorite'
                value='Pears' :bind='${this.favorite}' />
            Pears
        </label>
        <label>
            <input type='radio' name='favorite'
                value='Oranges' :bind='${this.favorite}' />
            Oranges
        </label>
        <p>
            <input type='button' onclick="${() => alert(this.favorite)}" value='Get' />
            <input type='button' onclick="${() => this.favorite = 'Oranges'}" value='Set (Oranges)' />
        </p>
    </div>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/two-way-data-binding-with-radio-3r0tno)


### Multiple Select

Multiple select elements use array-based for two-way data binding, where the bind attribute synchronizes the selected options with a component property.


```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Multiple() {
    // Default Value
    this.options = ['John','George'];
    
    const update = () => {
        // Update value
        this.options = ['Ringo'];
    }

    return render => render`<div>
        <p>${this.options}</p>
        <select multiple='multiple' size='10' :bind='${this.options}'>
            <option>Paul</option>
            <option>Ringo</option>
            <option>John</option>
            <option>George</option>
        </select>
        <p><input type="button" onclick="${update}" value="Update" /></p>
    </div>`
}
lemonade.render(Multiple, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Multiple() {
    // Default Value
    this.options = ['John','George'];

    const update = () => {
        // Update value
        this.options = ['Ringo'];
    }

    return render => render`<div>
        <p>${this.options}</p>
        <select multiple='multiple' size='10' :bind='${this.options}'>
            <option>Paul</option>
            <option>Ringo</option>
            <option>John</option>
            <option>George</option>
        </select>
        <p><input type="button" onclick="${update}" value="Update" /></p>
    </div>`
}
```

[See this example on codesandbox](https://codesandbox.io/s/two-way-data-binding-with-dropdown-hw73t2)


### Content Editable

LemonadeJS will track changes and keep the `this` property value in sync with changes in an editable div and vice versa.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Editor() {
    // Default value
    this.editor = 'Hello world';
    
    // Get the editor value
    const getValue = () => {
        console.log(this.editor)
    }

    return render => render`<div>
        <p>Content: ${this.editor}</p>
        <div contentEditable='true' class='input' :bind='self.editor'></div>
        <p><input type='button' onclick="${getValue}" value="Get value" /></p>
    </div>`;
}
lemonade.render(Editor, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Editor() {
    // Default value
    this.editor = 'Hello world';

    // Get the editor value
    const getValue = () => {
        console.log(this.editor)
    }

    return render => render`<div>
        <p>Content: ${this.editor}</p>
        <div :bind='self.editor' contentEditable='true' style='border:1px solid black'></div>
        <p><input type='button' onclick="${getValue}" value="Get value" /></p>
    </div>`;
}
```

[See this example on codesandbox](hhttps://codesandbox.io/s/two-way-data-binding-with-content-editable-div-7nryuj)



## Two-Way Data Binding in Components

LemonadeJS allows two-way data binding between components by synchronizing a parent component's property with a child component's value. Changes in the child's value are automatically reflected in the parent's property.

### Example

The example below demonstrates two-way data binding between components.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Test() {
    return render => render`<p>Component value: ${this.value}</p>`;
}

function Component() {
    // Default
    this.test = "Initial value";
    // Template
    return render => render`<div>
        <Test :bind="${this.test}" />
        <p>
            <input type='button' onclick="${() => alert(this.test) }" value="Get"  />
            <input type='button' onclick="${() => this.test = 'Test' }" value="Set" />
        </p>
    </div>`;
}
// Render
lemonade.setComponents({ Test });
// Render the component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

function Test() {
    return render => render`<p>Component value: ${this.value}</p>`;
}

// Register Component
lemonade.setComponents({ Test });

function Component() {
    // Default
    this.test = "Initial value";
    // Template
    return render => render`<div>
        <Test :bind="${this.test}" />
        <p>
            <input type='button' onclick="${() => alert(this.test) }" value="Get"  />
            <input type='button' onclick="${() => this.test = 'Test' }" value="Set" />
        </p>
    </div>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/two-way-data-binding-hpum0y)


## What is Two-Way Data Binding?

Two-way data binding is a technique that automatically synchronizes data between JavaScript variables and DOM elements, creating a real-time connection that updates in both directions. When a variable changes, the corresponding DOM element reflects the update automatically. Similarly, when a user interacts with the DOM element (e.g., typing in an input field), the linked variable is updated instantly.

This approach is commonly used in form handling, live search interfaces, and interactive data visualizations. By eliminating the need for manual DOM updates, two-way binding simplifies the development of responsive and dynamic user interfaces.


### What's Next?

Learn more about how LemonadeJS manages arrays and dynamic loops in the next section.\
\
[Dynamic Loops from Arrays](/docs/arrays){.button}

