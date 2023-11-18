title: Two-way data binding
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react
description: Two-way data binding helps to implement a synchronization between a the JavaScript and the view.

![Two-way data binding documentation](img/two-way-binding-animation.svg)

Two-way binding
===============

Two-way binding is a strategy to simplify the synchronization between a JavaScript reference and the HTML element value and vice versa. That means every change in the `self property` value reflects in the HTML element value, and every change in the HTML element value propagated back to the self.  

### The @bind attribute

The `@bind` attribute synchronizes the `self property` to the component or the HTML element value. Thus, the value between the component and the property will always be the same.

Two-way binding examples
------------------------

The following examples show how to bind simple and more complexnative HTML elements, such as multiple dropdowns, checkbox and much more.  

### Text input

The @bind creates a transparent event to keep the self property in sync with the value of the input text.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
let Input = function() {
    // Initial state
    let self = {
        input: 'paul@beatles.com'
    }
    // Two-way data binding values
    // Any change in the self.input will update the input and vice-versa.
    let template = `<>
        <h1>{{self.input}}</h1>
        <input type='text' @bind='self.input' />
        <input type='button' value='Update'
            onclick="self.input = 'New value'" />
        </>`

    return lemonade.element(template, self);
}

lemonade.render(Input, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-input-example-cswjt)

  
  

### Checkboxes

The checkbox works similarly to the example above. The state of the checkbox and the value of the self property is bound.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Checkbox = (function() {
    var self = {};
    self.email = true;
    self.phone = true;

    var template = `<>
        <span>Email: {{self.email}}</span><br>
        <span>Phone: {{self.phone}}</span><br>
        <fieldset>
        <legend>Contact options</legend>
            <label><input type='checkbox' @bind='self.email'/> Email</label>
            <label><input type='checkbox' @bind='self.phone'/> Phone</label>
        </fieldset>
        </>
    `;
    return lemonade.element(template, self);
});
lemonade.render(Checkbox, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-checkbox-example-d5ccj)

  
  

### Radio

On a radio HTML element the self attribute should be the same so, that self property holds the same value of the radio.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Radio = (function() {
    var self = {};
    self.favorite = 'Pears';
    var template = `
        <>
        <fieldset>
            <legend>Favorite fruit</legend>
            <label>
                <input type='radio' name='favorite'
                    value='Apples' @bind='self.favorite' />
                Apples
            </label>
            <label>
                <input type='radio' name='favorite'
                    value='Pears' @bind='self.favorite' />
                Pears
            </label>
            <label>
                <input type='radio' name='favorite'
                    value='Oranges' @bind='self.favorite' />
                Oranges
            </label>
        </fieldset>
        <br/>
        <input type='button' onclick="alert(self.favorite)" value='Get' />
        <input type='button' onclick="self.favorite = 'Oranges'"
            value='Set (Oranges)' />
        </>`;
    return lemonade.element(template, self);
});
lemonade.render(Radio, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-radio-example-scdsi)

  
  

### Multiple select

The multiple select has a different handler from other HTML elements. That is because a multiple select updates a array that holds the multiple value options.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Multiple = function() {
    var self = {};
    self.options = ['John','George'];

    var template = `
        <>
        <h1>{{self.options}}</h1>
        <select @bind='self.options' multiple='multiple' size='10'>
            <option>Paul</option>
            <option>Ringo<<option>
            <option>John</option>
            <option>George</option>
        </select><br/>
        <button onclick="self.options = ['Ringo'];">Update</button>
        </>`;

    return lemonade.element(template, self);
};
lemonade.render(Multiple, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-select-example-cr7zs)

  
  

### ContentEditable

LemonadeJS will track changes and keep the `self property` value in sync with changes in a editable div and vice versa.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Editable = function() {
    var self = {};
    self.editor = 'Hello world';

    var template = `
        <>
        <h1>Editor</h1>
        <div @bind='self.editor' contentEditable='true'
            style='border:1px solid black'></div><br/>
        <input type='button' onclick="alert(self.editor)" value="Get" />
        </>`;

    return lemonade.element(template, self);
};
lemonade.render(Editable, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-content-example-py8rw)

  
  

### Two-way binding in custom elements

The @bind attributed to custom elements will be bound with the attribute self.value insde the component.  
  

#### Basic implementation

In the following example using custom elements.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Component = function() {
    // This will bring all properties defined in the tag
    var self = this;
    // Custom HTML components has the self.value as default
    var template = `<>
        <b>Component value: {{self.value}}</b>
    </>
    `;
    // Create the component
    return lemonade.element(template, self);
}
var Custom = (function() {
    var self = {};
    self.test = "Initial value";
    var template = `<>
        <Component @bind="self.test" /><br/><br/>
        <input type='button' onclick="alert(self.test)" value="Get"  />
        <input type='button' onclick="self.test = 'Test'" value="Set" />
    </>`;

    return lemonade.element(template, self, { Component });
});
lemonade.render(Custom, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-custom--element-l2231)

  
  

### Integration with custom third-party plugins

The following example shows a jSuites Tags Plugin integrated with LemonadeJS.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<script src="https://jsuites.net/v4/jsuites.js"></script>
<link rel="stylesheet" href="https://jsuites.net/v4/jsuites.css" type="text/css" />
<div id='root'></div>
<script>
var Keywords = (function() {
    var self = {};
    // Render reactive component
    self.create = function(o) {
        jSuites.tags(o);
        // List of keywords
        self.keywords = 'Oranges,pears';
    }
    // Component reactive template
    var template = `<>
            <div @bind='self.keywords' @ready='self.create(this)'></div>
            <div>Keywords: {{self.keywords}}</div>
        </>`;

    return lemonade.element(template, self);
});
lemonade.render(Keywords, document.getElementById('root'));
</script>
</html>
```

The tags plugin component implements val() to integrate with LemonadeJS @bind.

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-two-way-binding-custom-plugin-9buvt)

  
  

Conclusion
----------

You might notice, in the example above, the usage of another of the native lemonade special HTML attribute: `@ready`. That is a method is called when the element is created and appended to the DOM.  
  

### More custom integrated custom components

More about other components that can be integrated with LemonadeJS, visit the jsuites [javascript plugins](https://jsuites.net/v3) website.  
  
  

Next chapter: [Dealing with arrays and loops](/docs/v2/arrays)
