title: Sugar - Super Global Artifacts
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, sugar, global artifacts, common container, redux like, redux
description: Share objects and actions across different components using LemonadeJS Sugar. Sugar plays a redux-like role on LemonadeJS components.

![Sugar helps the communication between components](img/sugar.svg)

Super global artifacts (Sugar)
==============================

When working with many different components is not rare that a self method or property should be accessible through the application. The `LemonadeJS Sugar` comes to solve this problem. It creates a global registry that allows a self or function to be registered and be available across different scopes when needed.  
  

### Summary of this chapter

This document covers those some important aspects of Sugar:

*   Make a self available across different components using Sugar set and get.
*   The data dispatcher can apply actions in a self preserving its private scope.
*   Register data dispatcher actions and call them from any component.
*   The persistence flag can be used to have a memory of the latest data dispatched for a particular sugar alias.

Example
-------

On the following example, the self is registered on the Profile component, and recovered on the Loader component.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='profile'></div>
<div id='loader'></div>
<script>
function Profile() {
    // Create a blank self
    let self = {};

    // Counter is created from the attribute counter
    let template = `<form>
            <label>Name:</label><br/>
            <input type="text" @bind="self.name" /><br/>
            <label>Email:</label><br/>
            <input type="text" @bind="self.email" />
        </form>`;

    // Register the self under My:Profile alias
    lemonade.set('My:Profile', self);

    return lemonade.element(template, self)
}

function Loader() {
    let self = {};
    self.load = function() {
        // Get My:Profile self
        let s = lemonade.get('My:Profile');

        // Updates directly to the self properties
        s.name = 'John Lennon';
        s.email = 'john.lennon@beatles.com';
    }

    let template = `<>
            <input type="button" value="Load the data"
                onclick="self.load()" />
        </>`;

    return lemonade.element(template, self);
}
lemonade.render(Profile, document.getElementById('profile'));
lemonade.render(Loader, document.getElementById('loader'));
</script>
</html>
```

### Profile

  
  

### Loader

  
  

Data Dispatcher
---------------

Sometimes for different reasons you don't want the whole self to be available but still need to update the state of some properties of one self from other components. A solution for that is to register a data dispatcher function to the LemonadeJS Sugar.  
  

### Basic Example with persistence

To make easy we will a similar example as above, using the flag persistence to keep the last dispatched data saved, even after a refresh.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='profile'></div>
<div id='loader'></div>
<script>
function Profile() {
    // Create a blank self for this component
    let self = {};

    // The template create the form elements
    let template = `<form>
            <label>Name:</label><br/>
            <input type="text" @bind="self.name" /><br/>
            <label>Email:</label><br/>
            <input type="text" @bind="self.email" />
        </form>`;

    // Register the dispatcher under Profile and set the persistence as true
    lemonade.set('Profile', function(s) {
        self.name = s.name;
        self.email = s.email;
    }, true);

    return lemonade.element(template, self)
}

function Loader() {
    let self = {};
    self.dispatch = function() {
        // Send new values to another component using the dispatcher
        lemonade.dispatch('Profile', {
            name: 'John Lennon',
            email: 'john.lennon@beatles.com',
        });
    }

    let template = `<>
            <input type="button" value="Load the data"
                onclick="self.dispatch()" />
        </>`;

    return lemonade.element(template, self);
}
lemonade.render(Profile, document.getElementById('profile'));
lemonade.render(Loader, document.getElementById('loader'));
</script>
</html>
```

### Profile

  
  

### Loader