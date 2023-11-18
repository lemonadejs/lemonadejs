![Two-way data binding](img/two-way-binding.png)

Two-way binding
===============

Two-way binding is a strategy to make easy the information sharing between the JavaScript and the view (HTML) and vice versa. In the previous chapter, we saw that changes in the self properties will impact automatically in the view. But how about the opposite? How the changes in the view will affect the properties in the self?  
  
The natural answer for this question is creating a JS event to update the self property as the follow. Of course, the example below is correct. But, that could be very time-consuming when dealing with lot of elements in the view. For this reason, Lemonadejs brings some magic properties to help with that.

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var self = { name: 'paul@beatles.com' };
lemonade.blender(`<input type='text' value='self.value'
    onchange='self.email = this.value'>`, self, document.getElementById('root'));
</script>
</html>
```
  

The HTML special lemonade properties
------------------------------------

There are three magic HTML property available: `@bind, @ready, @ref`. We are going to be discuss it further in the documentation, but for now lets focus on the `@bind`. This property would help to bind DOM elements to the properties and will bring the same result of the previous example.

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var self = { name: 'paul@beatles.com' };
lemonade.blender(`<input type='text' @bind='self.email'>`, self,
    document.getElementById('root'));
</script>
</html>
```
  
  

### Binding HTML form elements

The following example shows the `@bind` usage in different form elements

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var myComponent = (function() {
    var self = {};
    self.name = 'Roger Rabbit';
    self.valid = true;
    self.gender = 'male';

    var template = `<div>
        <div>Name: {{self.name}}</div>
        <div>Gender: {{self.gender}}</div>
        <div>Checked: {{self.valid}}</div>
        <br/>
        <label><input type="text" value="1" @bind="self.name" /></label><br/>
        <label>
            <select @bind="self.gender">
            <option value='male'>Male</option>
            <option value='female'>Female</option>
            </select>
        </label><br/>
        <label><input type="checkbox" @bind="self.valid" /></label>
    </div>`;

    return lemonade.element(template, self);
});

lemonade.render(myComponent, document.getElementById('root'));
</script>
</html>
```
  
  

Array binding
-------------

There is no natural observer in JavaScript for arrays. For that reason, to reflect any array updates back to the view, lemonade has a special `refresh` method, which can be called as below:

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var Tasks = (function() {
    var self = {};

    // List of tasks
    self.names = ['Buy a ticket to Manchester','Call the doctor'];

    // Overwrite the array toString method to create the HTML list  
    self.names.toString = function(v) {
        var str = '';
        for (var i = 0; i < this.length; i++) {
            str += '<li>' + this[i] + '</li>';
        }
        return str;
    }

    // Add new task method
    self.addTask = function(el) {
        // Relative node
        self.names.push(el.parentNode.children[1].value);
        self.names.refresh()

        // Reset task value
        el.parentNode.children[1].value = '';
    }

    // Component template
    var template = `<div>
            <h1>List of tasks</h1>
            <input type='text' />
            <input type='button' value='Add new task'
                onclick='self.addTask(this)' />
        </div><div>
            <div>{{self.names}}</div>
        </div>`;

    return lemonade.element(template, self);
});

lemonade.render(Tasks, document.getElementById('tasks'));
</script>
</html>
```
  
  

Advanced rich elements with jSuites
-----------------------------------

Jsuites is a lightweight collection of common plugins that is already integrated with lemonadejs.

### Keywords input example

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<script src="https://jsuites.net/jsuites.js"></script>
<link rel="stylesheet" href="https://jsuites.net/jsuites.css" type="text/css" />

<div id='root'></div>

<script>
var Keywords = (function() {
    var self = {};

    // Render component
    self.create = function(o) {
        jSuites.tags(o);

        // List of keywords
        self.keywords = 'Oranges,pears,apples';
    }

    // Component template
    var template = `<div>
            <div @bind='self.keywords' @ready='self.create(this)'></div>
        </div><div>
            <div>Keywords: {{self.keywords}}</div>
        </div>`;

    return lemonade.element(template, self);
});

lemonade.render(Keywords, document.getElementById('root'));
</script>
</html>
```

The view will be updated on the blur event

  
  
You might notice, in the example above, the usage of another of the native lemonade special HTML property: `@ready`. That is a method to be executed as soon as the element which contain the property is ready and appended to the DOM. But, we will see that in more details in the next chapter.  
  
More about other components that can be integrated with LemonadeJS, visit the jsuites [javascript plugins](https://jsuites.net/v3) website.  
  
  

Next chapter: [Native properties](/docs/v1/properties)