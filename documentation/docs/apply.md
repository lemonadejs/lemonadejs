# Apply

The `lemonade.apply` method binds a JavaScript object (`self`) to an existing HTML element rendered in the DOM. This makes it ideal for introducing reactivity or improving isolated sections or specific parts of an application or website without requiring a complete refactor.

### Example

This feature treats the HTML given as a template, creating dynamic bindings between the `self` object and the DOM to enable reactive updates and event handling.

{.ignore}
```html
<div id="template">
    <h1>{{self.title}}</h1>
    <div>
        <input type="button" value="Update title" onclick="self.update" />
    </div>
</div>
<script>
let self = {
    title: 'Hello World',
    update: function() {
        self.title = 'New title';
    }
}
lemonade.apply(document.getElementById('template'), self)
</script>
```


