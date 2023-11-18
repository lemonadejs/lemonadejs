title: LemonadeJS Sugar: A Redux-like Global State Manager,
keywords: LemonadeJS, Sugar, global state, redux-like, frontend, javascript library, global artifacts, common container,
description: Manage your application's global state using LemonadeJS Sugar, a redux-like state management solution for reactive web applications.

![Global communication between components](img/sugar.svg){style="max-height: 200px"}

Sugar (Super global artifacts)
==============================

When working with numerous components, it's not uncommon for a `self` method or property to be required across the application. LemonadeJS Sugar addresses this issue by creating a global registry allowing a self or function to be registered and made available across different scopes.  
  
> **Summary of this chapter**
>
> This document highlights several aspects of Sugar:
>
> - Make a self available across various components using Sugar's set and get methods;
> - Use the data dispatcher to act on a `self` property while preserving its private scope;
> - Register data dispatcher actions and call them from any component;
> - Leverage the persistence flag to save the latest data dispatched for a specific Sugar alias;
{.green}

Example
-------

In the following example, the self is registered on the Profile component and recovered on the Loader component.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Profile() {
    // Create a blank self
    const self = this;

    // Register the self under My:Profile alias
    lemonade.set('My:Profile', self);

    // Counter is created from the attribute counter
    return `<form>
        <label>Name:</label><br/>
        <input type="text" :bind="self.name" /><br/>
        <label>Email:</label><br/>
        <input type="text" :bind="self.email" />
    </form>`;
}

function Loader() {
    const self = this;
    self.load = function() {
        // Get My:Profile self
        let s = lemonade.get('My:Profile');
        // Updates directly to the self properties
        s.name = 'John Lennon';
        s.email = 'john.lennon@beatles.com';
    }

    return `<input type="button" value="Load the data" onclick="self.load()" />`;
}
lemonade.render(Profile, document.getElementById('root'));
lemonade.render(Loader, document.getElementById('root'));
</script>
</html>
```

Data Dispatcher
---------------

Sometimes, you might not want the entire `self` to be accessible but still need to update the state of specific properties of one {self} from other components. A solution for this scenario is registering a data dispatcher function with LemonadeJS Sugar.  
  

### A basic example of persistence

To illustrate this concept, we'll use an example similar to the one above, utilizing the persistence flag to maintain the last dispatched data saved, even after a page refresh.  
  

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Profile() {
    // Create a blank self for this component
    const self = this;

    // Register the dispatcher under Profile
    // and set the persistence as true
    lemonade.set('Profile', function(s) {
        self.name = s.name;
        self.email = s.email;
    }, true);

    // The template create the form elements
    return `<form>
        <label>Name:</label><br/>
        <input type="text" :bind="self.name" /><br/>
        <label>Email:</label><br/>
        <input type="text" :bind="self.email" />
    </form>`;
}

function Loader() {
    const self = this;
    self.dispatch = function() {
        // Send new values to another component using the dispatcher
        lemonade.dispatch('Profile', {
            name: 'John Lennon',
            email: 'john.lennon@beatles.com',
        });
    }
    return `<input type="button" value="Load" onclick="self.dispatch()" />`;
}
lemonade.render(Profile, document.getElementById('root'));
lemonade.render(Loader, document.getElementById('root'));
</script>
</html>
```