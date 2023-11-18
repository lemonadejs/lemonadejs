title: Implementing Reactive Attributes with LemonadeJS
keywords: LemonadeJS, reactive attributes, data binding, frontend development, JavaScript library, user interface, UI updates
description: Explore the capabilities of reactive attributes in LemonadeJS to establish dynamic data connections within user interfaces, enhancing synchronization between the DOM and your application's state without external dependencies.

![Two-way data binding examples](img/forms.png)

The special attributes
======================

LemonadeJS enhances HTML tags with specialized attributes, offering additional functionality integral to the library's reactive system. These attributes `:ref`, `:bind`, `:loop`, and `:ready` serve unique purposes within the framework:

{.green}
> **Summary of this chapter**
>
> Each LemonadeJS attributes starts with `:` and can be added to an HTML tag as follows:
>
> - `:ref`: assigns a direct reference to a DOM element within the {self} property.
> - `:bind`: establishes a bidirectional connection between a DOM element and a {self} property.
> - `:ready`: triggers a specified method once the component is inserted into the DOM.
> - `:loop`: iterates over an array of objects, rendering them into the DOM.
>
> **Note** It's important to note that from version 3 onwards, the lm- prefix is no longer used.

 
Special Attributes
------------------

### References to DOM elements

The `:ref` creates a property in the `self` as a reference to the DOM element defined in the template.  
  

```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Reference() {
    const self = this;
    self.update = function() {
        self.text.style.color = 'red';
    }
    return `<>
        <input value='Any text' :ref='self.text' />
        <input type='button' onclick='self.update()' value='Update' />
    </>`;
}
lemonade.render(Reference, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Reference() {
    const self = this;
    self.update = function() {
        self.text.style.color = 'red';
    }
    return `<>
        <input value='Any text' :ref='self.text' />
        <input type='button' onclick='self.update()' value='Update' />
    </>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-references-4nqikx)


### Two-way data binding

The `:bind` implements a synchronization `self` property to a component or HTML element value.  
  

```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Two() {
    const self = this;
    // Default value for this property = default value for the dropdown
    self.name = 'Ringo';
    return `<>
        <span>{{self.name}}</span><br/><br/>
        <select :bind='self.name'>
        <option>John</option>
        <option>Paul</option>
        <option>George</option>
        <option>Ringo</option>
        </select>
    </>`;
}
lemonade.render(Two, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Two() {
    const self = this;
    // Default value for this property = default value for the dropdown
    self.name = 'Ringo';
    return `<>
        <span>{{self.name}}</span><br/><br/>
        <select :bind='self.name'>
        <option>John</option>
        <option>Paul</option>
        <option>George</option>
        <option>Ringo</option>
        </select>
    </>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/two-way-data-binding-4b212q)

  
  
  

### When an DOM element is ready

The `:ready` will call the defined method when the element is ready and appended to the DOM.  
  
```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Ready() {
    const self = this;
    // Execute the method when the element is mount
    self.getWidth = function(element) {
        self.width = element.offsetWidth;
    }
    return `<>
        <input :ready='self.getWidth(this)'/>
        <i>The input width is: {{self.width}}</i>
    </>`;
}
lemonade.render(Ready, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Ready() {
    const self = this;
    // Execute the method when the element is mount
    self.getWidth = function(element) {
        self.width = element.offsetWidth;
    }
    return `<>
        <input :ready='self.getWidth(this)'/>
        <i>The input width is: {{self.width}}</i>
    </>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/element-is-ready-164vdj)

  
  
  

### Create multiple elements from an array

The `:loop` creates a list of elements based on a template from an array of objects.  
  
```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Loop() {
    const self = this;
    // Options for the loop
    self.rows = [
        {
            title:'Google',
            description: 'The alpha search engine...'
        },
        {
            title:'Bind',
            description: 'The microsoft search engine...'
        },
    ];
    // :loop only can be used in custom elements
    return `<ul :loop="self.rows">
        <li><b>{{self.title}}</b><br/><i>{{self.description}}</i></li>
    </ul>`;
}
// Render the loop component
lemonade.render(Loop, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Loop() {
    const self = this;
    // Options for the loop
    self.rows = [
        {
            title:'Google',
            description: 'The alpha search engine...'
        },
        {
            title:'Bind',
            description: 'The microsoft search engine...'
        },
    ];
    // :loop only can be used in custom elements
    return `<ul :loop="self.rows">
        <li><b>{{self.title}}</b><br/><i>{{self.description}}</i></li>
    </ul>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/render-from-an-array-of-objects-exexiu)

  

## Custom attributes

### Attributes as references

LemonadeJS allows setting Booleans, Numbers, or functions into the DOM attribute value by prefixing any attributes of a DOM element with `:` and transforming them into a dynamic reference; this feature provides an efficient way to interact with and connect data types and internal functionalities with the user interface elements.


Next Chapter
------------

Next, dive into the `:bind` attribute to master two-way data binding with HTML forms in LemonadeJS.

&nbsp;

[Next Chapter: Two way binding](/docs/v4/two-way-binding){.button .main}