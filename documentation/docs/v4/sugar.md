title: Global Application State Management
keywords: LemonadeJS, Sugar, Global State Management, Redux-Inspired, Frontend Development, JavaScript, Shared State Container
description: Simplify global state management in your web applications with LemonadeJS Sugar. This feature of LemonadeJS provides a centralized state container for managing and sharing state across components, delivering a reactive and cohesive application experience.

Sugar (Super global artifacts)
==============================

When managing complex applications with numerous components, sharing methods or properties, referred to as `self` in LemonadeJS, between these components becomes essential. LemonadeJS Sugar provides a solution to this with a global registry that allows for registering `self` methods or properties, making them accessible application-wide.  
  
> **Summary of this chapter**
>
> This document highlights several aspects of Sugar:
>
> - **Global Access**: Utilize Sugar's set and get methods to make a self available throughout various components, ensuring efficient scope sharing.
> - **Data Dispatchers**: Employ data dispatchers to manipulate `self` properties while upholding their private scope, enhancing security and encapsulation.
> - **Action Registration**: Facilitate global communication by registering data dispatcher actions, which can be invoked from any component, streamlining event handling.
> - **Persistent State**: Capitalize on the persistence flag to maintain the latest data state across sessions for a Sugar alias, providing a seamless user experience.
{.green}

With these features, LemonadeJS Sugar provides a robust and intuitive approach to managing global states and facilitating communication between components.

Example
-------

In the following example, the self is registered on the Profile component and recovered on the Loader component.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
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
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
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