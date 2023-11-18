title: Working with Arrays, Loops, and Lists in LemonadeJS
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, arrays, loops, lists
description: Effortlessly generate lists of elements from arrays using LemonadeJS's loop attribute for seamless UI rendering.

![Reactive library loop](img/arrays.svg)

Arrays
======

The attribute `:loop` helps to render elements from an array of objects.

**Summary of this chapter**

*   **:loop on real HTML tags**: The innerHTML is the template for each item of the array.
*   **A self per entry**: A new self will be created and associate to each entry of the array.
*   **Special self properties**: For each self created two special properties will be added automatically `parent` and `el`.
*   **Naming**: Custom element's name should always have a first capital letter follow by all lowercase letters.
*   **Root element**: The tag with :loop should always has a parentNode.
*   **Re-use**: If you would like to use the same property in different :loop, you can use the property unique=false.



Examples
--------



### :loop on real HTML tags

When using the `:loop` on a native HTML tag, the innerHTML of the tag will be considered the template to create the elements.

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Crypto() {
    const self = this;

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The ul.innerHTML is the template for each item of the array
    return `<ul :loop="self.data">
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
    const self = this;

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The ul.innerHTML is the template for each item of the array
    return `<ul :loop="self.data">
        <li>{{self.title}}</li>
    </ul>`;
}
```



### :loop on custom HTML tags

Custom components allow controls and behavior to be bound to each element in the array. In the following example, the parent contains the template for each child.

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
/**
 * This method is called one time for each entry in the array
 */
function List(template) {
    // "this" is a reference for each entry in the array.
    const self = this;
    // Return the template
    return template;
}

function Component() {
    const self = this;

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The template for the List is defined inside the parent.
    // That is going to be used for for each element in the array.
    return `<ul>
        <List :loop="self.data">
            <li>{{self.title}}</li>
        </List>
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

function List(template) {
    // "this" is a reference for each entry in the array.
    const self = this;
    // Return the template
    return template;
}

lemonade.setComponents({ List })

export default function Component() {
    const self = this;

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The template for the List is defined inside the parent.
    // That is going to be used for for each element in the array.
    return `<ul>
        <List :loop="self.data">
            <li>{{self.title}}</li>
        </List>
    </ul>`;
}
```


### Custom components with :loop and controls

The next example, brings the template inside the custom controller, and includes custom function to add and delete items in the array.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const self = this;

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    self.add = function() {
        self.data.push({ title: self.text });
        // Update the view
        self.refresh('data');
        // Reset label
        self.text = '';
    }

    self.del = function(s) {
        self.data.splice(self.data.indexOf(s), 1);
        // Update the view
        self.refresh('data');
    }

    return `<>
        <ul :loop="self.data">
            <li>
                <i>{{self.title}}</i>
                <span onclick="self.parent.del(self)"
                        style="cursor: pointer;">x</span>
            </li>
        </ul>
        <input type="text" :bind="self.text" />
        <input type="button" value="Add" onclick="self.add()" />
    </>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const self = this;

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    self.add = function() {
        self.data.push({ title: self.text });
        // Update the view
        self.refresh('data');
        // Reset label
        self.text = '';
    }

    self.del = function(s) {
        self.data.splice(self.data.indexOf(s), 1);
        // Update the view
        self.refresh('data');
    }

    return `<>
        <ul :loop="self.data">
            <li>
                <i>{{self.title}}</i>
                <span onclick="self.parent.del(self)"
                        style="cursor: pointer;">x</span>
            </li>
        </ul>
        <input type="text" :bind="self.text" />
        <input type="button" value="Add" onclick="self.add()" />
    </>`;
}
```

  
  

### Using the same property on the :loop in different tags.

As described above, LemonadeJS will create a DOM Element and save the reference for each position in the Array. This reference will force a single DOM, limiting the use of the same array property in different tags. As a workaround, a property unique="false" can be added to the root element, as shown below:  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
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
    return `<>
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
    return `<>
            <ul :loop="self.data" unique="false">
                <li>{{self.title}}v/li>
            </ul>
            <ul :loop="self.data" unique="false">
                <li>{{self.name}}</li>
            </ul>
        </>`;
}
```

  
  

More references
---------------

  

### Related examples

*   [How to create a dynamic table from an array of objects](/docs/v3/examples/table)
*   [How to create a five-star rating](/docs/v3/examples/rating)

  

### Related libraries

*   [Five star rating reusable component](/docs/plugins/rating)
*   [List with search and pagination](/docs/plugins/list)

  
  

Conclusion
----------

For each element of an array we have the template to be cloned and each element of array has its own `self`, `self.parent` and `self.el`  

&nbsp;

[Next chapter: Programmatic methods](/docs/v3/methods){.button .main}
