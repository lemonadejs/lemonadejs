title: Component Loops using LemonadeJS  
keywords: LemonadeJS, two-way binding, frontend, JavaScript library, reactive, React, Vue, Angular, arrays, loops, lists  
description: Generate dynamic lists from arrays using the LemonadeJS loop attribute.  
canonical: https://lemonadejs.com/docs/arrays

# Loops

The `:loop` attribute in LemonadeJS enables dynamic list generation by iterating over an array of objects and rendering each item with a template string. Each item's properties are inherently reactive, allowing updates to individual elements without re-rendering the entire list. This attribute works seamlessly with both DOM elements and custom components. Each rendered item maintains its context, including the following reserved properties:

| Property | Description                                                     |
|----------|-----------------------------------------------------------------|
| `el`     | A reference to the item's root DOM element.                     |
| `parent` | A reference to the parent component containing the loop.        |

## Examples

### Loop on DOM Elements

When applying the loop attribute to a DOM element, its inner HTML serves as the template for rendering each item in the array, as demonstrated below.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Crypto() {

    this.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The ul.innerHTML is the template for each item of the array
    return render => render`<ul :loop="${this.data}">
        <li>{{self.title}}</li>
    </ul>`;
}
lemonade.render(Crypto, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Crypto() {

    this.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The ul.innerHTML is the template for each item of the array
    return render => render`<ul :loop="${this.data}">
        <li>{{self.title}}</li>
    </ul>`;
}
```

### Loop on Components

When a loop is used on the custom element, the component will be rendered multiple times, one for each entry of the array.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function List() {
    return render => render`<li>${this.title}</li>`;
}

function Component() {
    this.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    return render => render`<ul>
        <List :loop="${this.data}" />
    </ul>`;
}
// Declare the global elements
lemonade.setComponents({ List })
// Render
lemonade.render(Component, document.getElementById('root'));
</script>
```
```javascript
import lemonade from 'lemonadejs';

function List() {
    return render => render`<li>${this.title}</li>`;
}

lemonade.setComponents({ List })

export default function Component() {
    this.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    return render => render`<ul>
        <List :loop="${this.data}" />
    </ul>`;
}
```


### Interacting with the Loops

The next example, brings the template inside the custom controller, and includes custom function to add and delete items in the array.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {

    const add = () => {
        this.data.push({ title: this.text });
        // Update the data property in the view
        this.refresh('data');
        // Reset label
        this.text = '';
    }

    const del = (e, itemOfTheArray) => {
        this.data.splice(this.data.indexOf(itemOfTheArray), 1);
        // Update the view
        this.refresh('data');
    }

    this.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    return render => render`<div>
        <ul :loop="${this.data}">
            <li>
                <i>{{self.title}}</i>
                <span onclick="${del}" style="cursor: pointer;"> (x)</span>
            </li>
        </ul>
        <input type="text" :bind="self.text" />
        <input type="button" value="Add" onclick="${add}" />
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const add = () => {
        this.data.push({ title: this.text });
        // Update the data property in the view
        this.refresh('data');
        // Reset label
        this.text = '';
    }

    const del = (e, itemOfTheArray) => {
        this.data.splice(this.data.indexOf(itemOfTheArray), 1);
        // Update the view
        this.refresh('data');
    }

    this.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    return render => render`<div>
        <ul :loop="${this.data}">
            <li>
                <i>{{self.title}}</i>
                <span onclick="${del}" style="cursor: pointer;"> (x)</span>
            </li>
        </ul>
        <input type="text" :bind="self.text" />
        <input type="button" value="Add" onclick="${add}" />
    </div>`;
}
```


### Using the same property on the :loop in different tags.

As described above, LemonadeJS will create a DOM Element and save the reference for each position in the Array. This reference will force a single DOM, limiting the use of the same array property in different tags. As a workaround, a property unique="false" can be added to the root element, as shown below:  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Multiple() {
    const self = this;

    self.data = [
        { title: 'BTC', name: 'BitCoin' },
        { title: 'ETH', name: 'Ethereum' },
        { title: 'LTC', name: 'LiteCoin' },
    ];

    // Unique is used to avoid a single DOM reference.
    // The self.el won't be added to the array.
    return render => render`<>
        <ul :loop="self.data" unique="false">
            <li>{{self.title}}</li>
        </ul>
        <ul :loop="self.data" unique="false">
            <li>{{self.name}}</li>
        </ul>
    </>`;
}

lemonade.render(Multiple, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Multiple() {
    const self = this;

    self.data = [
        { title: 'BTC', name: 'BitCoin' },
        { title: 'ETH', name: 'Ethereum' },
        { title: 'LTC', name: 'LiteCoin' },
    ];

    // Unique is used to avoid a single DOM reference.
    // The self.el won't be added to the array.
    return render => render`<>
        <ul :loop="self.data" unique="false">
            <li>{{self.title}}</li>
        </ul>
        <ul :loop="self.data" unique="false">
            <li>{{self.name}}</li>
        </ul>
    </>`;
}
```

### Manual Loops  

You can also create manual loops using javascript as below. 

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Define an array to display in the view
    this.items = ['Item 1', 'Item 2'];

    // Add a new item and refresh the view
    const addItem = () => {
        // Add a new item
        this.items.push(`Item ${this.items.length + 1}`);
        // Refresh the view
        this.refresh('items');
    };

    return render => render`
        <div>
            <ul>
                ${this.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <input type="button" value="Add Item" onclick="${addItem}" />
        </div>
    `;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Multiple() {
    // Define an array to display in the view
    this.items = ['Item 1', 'Item 2'];

    // Add a new item and refresh the view
    const addItem = () => {
        // Add a new item
        this.items.push(`Item ${this.items.length + 1}`);
        // Refresh the view
        this.refresh('items');
    };

    return render => render`
        <div>
            <ul>
                ${this.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <input type="button" value="Add Item" onclick="${addItem}" />
        </div>
    `;
}
```

## Key Points

- **Template**: HTML content serves as the template for each array item.
- **Context**: Each item gets its scope via the `self`{.highlight} object.
- **Properties**: Items include `parent`{.highlight} and `el`{.highlight} references for context and DOM access.
- **Reusability**: Use `unique="false"` to reuse a `loop`{.highlight} across multiple elements.


### More references

*   [How to create a dynamic table from an array of objects](/docs/examples/table)
*   [How to create a five-star rating](/docs/examples/rating)



## What's Next?

The next section explores best practices for component communication using Sugar.\
\
[Communication Between Components Using Sugar](/docs/sugar){.button}
