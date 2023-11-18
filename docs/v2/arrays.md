title: Arrays, loops and lists
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, arrays, loops, loop, lists
description: How to create a list of elements from an array using the loop attribute.

![LemonadeJS arrays and loop](img/arrays.svg)

Arrays
======

The new LemonadeJS brings a new attribute `@loop` to handle array of objects.  
  

### Summary of this chapter

*   **@loop on real HTML tags**: The innerHTML would be removed and considered a HTML template.
*   **A self per entry**: A new self will be create and associate to each entry of the array.
*   **Special self properties**: For each self created two special properties will be added automatically `parent` and `el`.
*   **Naming**: Custom element's name should always have a first capital letter follow by all lowercase letters.
*   **Root element**: The tag with @loop should be added to a empty tag. <div><Component @loop="self.data" /></div>
*   **Array re-use**: If you would like to use the same property in different @loop, you can use the property unique=false.

  
  

Examples
--------

  

### @loop on real HTML tags

When using the `@loop` on a native HTML tag, the innerHTML of the tag will be considered the template to create the elements.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
const Crypto = function() {
    let self = {};

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The ul.innerHTML in the following template will be
    // used as the template for each item of the array.
    let template = `<ul @loop="self.data">
        <li>{{self.title}}</li>
    </ul>`;

    return lemonade.element(template, self);
}
lemonade.render(Crypto, document.getElementById('root'));
</script>
```
  
  

### @loop on custom HTML tags

Custom components allows controls and behavior to be bound to each element in the array. In the follow example, the template is defined in the parent.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
/**
 * This method is called one time for each entry in the array
 */
const List = function(template) {
    // "this" is a reference for each entry in the array.
    let self = this;

    // Template defined inside the parent
    return lemonade.element(template, self);
}

const Component = function() {
    let self = {};

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    // The template for the List is defined inside the parent.
    // That is going to be used for for each element in the array.
    let template = `<ul>
        <List @loop="self.data">
            <li>{{self.title}}</li>
        </List>
    </ul>`;

    return lemonade.element(template, self, { List });
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
  
  

### Custom components with @loop and controls

The next example, brings the template inside the custom controller, and includes custom function to add and delete items in the array.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
const Component = function() {
    let self = {};

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

    let template = `<>
        <ul @loop="self.data">
            <li>
                <i>{{self.title}}</i>
                <span onclick="self.parent.del(self)"
                        style="cursor: pointer;">x</span>
            </li>
        </ul>
        <input type="text" @bind="self.text" />
        <input type="button" value="Add" onclick="self.add()" />
    </>`;

    return lemonade.element(template, self);
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
  
  

### Using the same property on the @loop in different tags.

As described above, LemonadeJS will create a DOM Element and save the reference for each position in the Array. This reference will force a single DOM, limiting the use of the same array property in different tags. As a workaround, a property unique="false" can be added to the root element, as shown below:  
  

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
const Multiple = function() {
    let self = {};

    self.data = [
        { title: 'BTC', name: 'BitCoin' },
        { title: 'ETH', name: 'Ethereum' },
        { title: 'LTC', name: 'LiteCoin' },
    ];

    // Unique is used to avoid a single DOM reference.
    // The self.el won't be added to the array.
    let template = `<>
            <ul @loop="self.data" unique="false">
                <li>{{self.title}}v/li>
            </ul>
            <ul @loop="self.data" unique="false">
                <li>{{self.name}}</li>
            </ul>
        </>`;

    return lemonade.element(template, self);
}

lemonade.render(Multiple, document.getElementById('root'));
</script>
</html>
```
  
  

Related examples
----------------

*   [How to create a dynamic table from an array of objects](/docs/v2/examples/table)
*   [How to create a five star rating](/docs/v2/examples/rating)

  

Related libraries
-----------------

*   [Five star rating reusable component](/docs/v2/plugins/rating)
*   [List with search and pagination](/docs/v2/plugins/list)

  
  

Conclusion
----------

For each element of an array we have the template to be cloned and each element of array has its own `self`, `self.parent` and `self.el`  

Next chapter: [Programmatic methods](/docs/v2/methods)
