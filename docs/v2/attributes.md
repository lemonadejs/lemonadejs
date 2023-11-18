title: The special reactive attributes
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, special attributes
description: The LemonadeJS special reactive attributes are used to help to create actions between the view and the controllers.

![Two-way data binding with LemonadeJS](img/forms.png)

The special attributes
======================

The LemonadeJS attributes are special HTML attributes you can append to an HTML tag. There are four native LemonadeJS attributes, they are the `@ref`, `@bind`, `@loop` and `@ready`. In this section we will go through each of them with examples.  
  

### Summary of this chapter

Each of the four special LemonadeJS attributes starts with @ and can be included any HTML tags, such as:  
  
`**@ref** add a property in the self that keeps a reference to the DOM element.   <div @ref="self.myDiv"></div>      **@bind** is used to create a two-way binding between a tag and the specified self property.   <input type="text" @bind="self.name" />      **@ready** is a method which will be executed when the element is ready and appended to the DOM.   <div @ready="self.ready(this)"></div>      **@loop** is a attribute used in custom lemonadeJS components to render a HTML based on an array of objects.   <List @loop="self.myArray" />      `

#### Alternative Syntax

Alternatively, you can use the following properties `lm-ref`, `lm-bind`, `lm-loop` and `lm-ready` for the same purpose.  
  

  

Create a reference with @ref
----------------------------

The `@ref` creates a property in the `self` as a reference to the element defined in the template.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Reference = (function() {
    var self = {};
    self.update = function() {
        self.text.style.color = 'red';
    }

    var template = `<>
        <input value='Any text' @ref='self.text' />
        <input type='button' onclick='self.update()'value='Update' />
        </>`;

    return lemonade.element(template, self);
});

lemonade.render(Reference, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-ref-examples-rg9i7)

  
  
  

Tracking changes with @bind
---------------------------

The `@bind` helps to link a `self` property to the HTML element value. Thus helping to keep the synchronization the desired property and the component value.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Tracking = (function() {
    var self = {};

    // Default value for this property = default value for the dropdown
    self.name = 'Ringo';

    var template = `<>
        <span>{{self.name}}</span><br/><br/>
        <select @bind='self.name'>
        <option>John</option>
        <option>Paul</option>
        <option>George</option>
        <option>Ringo</option>
        </select>
        </>`;

    return lemonade.element(template, self);
});
lemonade.render(Tracking, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://.io/s/lemonadejs-bind-example-m1cvy)

  
  
  

When an element is @ready
-------------------------

The `@ready` will call the defined method when the element is ready and appended into the DOM.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Ready = (function() {
    var self = {};

    // Execute the method when the element is mount
    self.getWidth = function(element) {
        self.width = element.offsetWidth;
    }

    var template = `<>
        <input @ready='self.getWidth(this)'/>
        <i>The input width is: {{self.width}}</i>
    </>`;

    return lemonade.element(template, self);
});
lemonade.render(Ready, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-ready-example-hbh0x)

  
  
  

Component lists from an array of objects using @loop
----------------------------------------------------

The `@loop` creates a list of elements based on a template from an array of objects.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Mylist = (function() {
    // Create one self for each interaction in the array
    var self = this;
    // Template
    var template = `<li>
            <b>{{self.title}}</b><br>
            <i>{{self.description}}</i>
        </li>`;

    return lemonade.element(template, self);
});

var Loop = (function() {
    var self = {};

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

    // @loop only can be used in custom elements
    var template = `<ul><Mylist @loop="self.rows" /></ul>`;

    return lemonade.element(template, self, { Mylist });
});
lemonade.render(Loop, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-loop-example-hxsz6)

  
  
  

Next chapter
------------

We will explore each of those LemonadeJS attributes in the next few chapters. In the next one, we will give focus on the @bind and the HTML form element two-way binding.

Next chapter: [Two way binding](/docs/v2/two-way-binding)
