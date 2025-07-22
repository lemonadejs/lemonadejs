title: LemonadeJS Object Forms
keywords: LemonadeJS, form binding, object synchronization, reactive forms, JavaScript library, frontend development, form management  
description: Use LemonadeJS Object Forms to bind form elements to a JavaScript object, enabling reactive updates from form to object and programmatic updates from object to form for easy data management and nested object creation.  
canonical: https://lemonadejs.com/docs/object-forms

# LemonadeJS Object Forms

LemonadeJS Object Forms simplify form handling by linking form elements to a JavaScript object using the `setPath` method. Updates on the element values update the object path value automatically, while object changes can be applied to the form using `setForm`. It’s perfect for managing complex, nested data structures without manual DOM manipulation.

## How It Works

The `setPath` method creates a reactive form object and a function to update form values. You define an initial object and an optional callback to handle changes. Form elements tagged with `lm-path` (or `:path`) map to properties in the object using dot notation (e.g., `options.mask`). When a form element’s value changes, the object updates automatically. To update the form with new object values, call `setForm`.

### Key Features

- **Reactive Updates**: Form inputs update the object instantly.
- **Programmatic Control**: Use `setForm` to sync object changes to the form.
- **Nested Objects**: Supports deep paths like `options.mask` for complex data.
- **Callback Support**: Run custom logic when form values change.
- **Flexible Inputs**: Works with text inputs, dropdowns, checkboxes, and custom components.

## Documentation

### setPath

| Method    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `setPath` | `@param {any} initial` - Initial object with form values.<br>`@param {Function} callback` - Optional function triggered when a form element updates the object. Receives `value`, `path`, and `element` as arguments.<br>`@return [form, setForm]` - Array containing the reactive form object and the `setForm` function to update form values.<br>`setPath(initial: any, callback?: (value: any, path: string, element: HTMLElement) => void) => [object, Function, Function]` |


> **Note:** The `setPath` method returns three items: `form`, `setForm`, and `getForm`.
> - `form` is the reactive object containing the current form values.
> - `setForm` is used to update or overwrite the form values.
> - `getForm` returns the form values, optionally filtering out fields that are currently hidden.


### lm-path / :path

| Attribute | Description                                                                                                           |
|-----------|-----------------------------------------------------------------------------------------------------------------------|
| `lm-path` | Specifies the dot-notated path in the form object (e.g., `title`, `options.mask`). Binds the element’s value to that path. |

## Example

The `form` object holds the values of your form, and `setForm` applies new values to the form elements based on the defined `lm-path` attributes.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>

const { setPath } = lemonade;

function Component() {
    let properties = {
        options: {
            mask: 123,
        },
        title: 'Test',
    };

    let [data, setData] = setPath(properties, (value, path, element) => {
        console.log(`Updated ${path} to ${value}`);
    });

    const save = () => {
        // send data to the server to persist the form information
        console.log('Form data:', data);
    };

    return render => render`<div>
        <div class='lm-row'>
            <div class='lm-column lm-f1'>
                <div class='lm-form-group'>
                    <label>Header Title</label>
                    <input type='text' lm-path="title" />
                </div>
            </div>
        </div>
        <div class='lm-row'>
            <div class='lm-column lm-f1'>
                <div class='lm-form-group'>
                    <label>Mask</label>
                    <input type='text' placeholder="#.##0,00" lm-path="options.mask" />
                </div>
            </div>
        </div>
        <div class='lm-row'>
            <input type="button" value="Save" onclick="${save}" />
        </div>
    </div>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { setPath } from 'lemonadejs';

export default function Test() {
    let properties = {
        options: {
            mask: 123,
        },
        title: 'Test',
    };

    let [data, setData] = setPath(properties, (value, path, element) => {
        console.log(`Updated ${path} to ${value}`);
    });

    const save = () => {
        // send data to the server to persist the form information
        console.log('Form data:', data);
    };

    return render => render`<div>
        <div class='lm-row'>
            <div class='lm-column lm-f1'>
                <div class='lm-form-group'>
                    <label>Header Title</label>
                    <input type='text' lm-path="title" />
                </div>
            </div>
        </div>
        <div class='lm-row'>
            <div class='lm-column lm-f1'>
                <div class='lm-form-group'>
                    <label>Mask</label>
                    <input type='text' placeholder="#.##0,00" lm-path="options.mask" />
                </div>
            </div>
        </div>
        <div class='lm-row'>
            <input type="button" value="Save" onclick="${save}" />
        </div>
    </div>`;
}
```

### What's Next?

Learn more about how LemonadeJS manages arrays and dynamic loops in the next section.\
\
[Dynamic Loops from Arrays](/docs/arrays){.button}