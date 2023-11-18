title: Leveraging Reactive Attributes in LemonadeJS,
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, special attributes,
description: Harness the power of LemonadeJS's special reactive attributes to create seamless interactions between views and controllers.

![Two-way data binding examples](img/forms.png)

The special attributes
======================

LemonadeJS provides special HTML attributes that can be appended to HTML tags to enhance their functionality. There are four native LemonadeJS attributes: `:ref`, `:bind`, `:loop`, and `:ready`. In this section, we will go through each of these attributes with examples.  
  
> **Summary of this chapter**
>
> Each LemonadeJS attributes starts with `:` and can be added to an HTML tag as follows:  
>
> - **:ref** adds a property to the `self` object that keeps a reference to the DOM element;
> - **:bind** creates a two-way binding between a tag and the specified `self` property;
> - **:ready** defines a method call when the element is ready and appended to the DOM;
> - **:loop** is an attribute that renders an array of objects into the DOM;
>
> **Note** that `lm-` prefix has been deprecated from version 3.
{.green}
 
Special Attributes
------------------

### Create a reference with `:ref`

The `:ref` creates a property in the `self` as a reference to the DOM element defined in the template.  
  

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
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

  
  
  

### Two-way data binding with :bind

The `:bind` implements a synchronization `self` property to a component or HTML element value.  
  

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
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

  
  
  

### When an element is :ready

The `:ready` will call the defined method when the element is ready and appended to the DOM.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
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

  
  
  

### Render from an array of objects using :loop

The `:loop` creates a list of elements based on a template from an array of objects.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
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

  

### Custom :attributes to pass information as a reference

LemonadeJS v3.2.0+ accepts custom elements to use : to define a property that will receive a value as a reference.  
  
  

Next Chapter
------------

We will explore each of those LemonadeJS attributes in the following few chapters. In the next one, we will focus on the `:bind` property and the HTML form element two-way binding.

&nbsp;

[Next Chapter: Two way binding](/docs/v3/two-way-binding){.button .main}