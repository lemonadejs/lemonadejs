title: Data Sharing and Global Actions Management
keywords: LemonadeJS, Sugar, Global State Management, Redux-Inspired, Frontend Development, JavaScript, Shared State Container
description: Simplify global property and action management with Sugar. Facilitate data sharing, state persistence, centralized debugging, and seamless interaction across application components.
canonical: https://lemonadejs.com/docs/sugar

# Sugar

## Super Global Artifacts

Sugar is a communication system in LemonadeJS that enables state sharing between components using a **pub/sub pattern**.
Components subscribe to named events with `set`{.highlight} and trigger updates using `dispatch`{.highlight}, allowing state synchronization across
the application. Components automatically update when changes are dispatched to their subscribed events.


### Examples

#### Scope

##### Public Scope

In this example, the Profile component is globally registered with the alias `My:Profile`, making it accessible throughout the application. The Loader component retrieves the registered Profile instance and updates its properties directly.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Profile() {
    // Register the self under My:Profile alias
    lemonade.set('My:Profile', this);

    // Counter is created from the attribute counter
    return render => render`<form>
        <label>Name:</label><br/>
        <input type="text" :bind="self.name" /><br/>
        <label>Email:</label><br/>
        <input type="text" :bind="self.email" />
    </form>`;
}

function Loader() {

    const load = function() {
        // Get My:Profile self
        let s = lemonade.get('My:Profile');
        // Updates directly to the self properties
        s.name = 'John Lennon';
        s.email = 'john.lennon@beatles.com';
    }

    return render => render`
        <input type="button" value="Load the data" onclick="${load}" />
    `;
}
lemonade.render(Profile, document.getElementById('root'));
lemonade.render(Loader, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Profile() {
    // Register the self under My:Profile alias
    lemonade.set('My:Profile', this);

    // Counter is created from the attribute counter
    return render => render`<form>
        <label>Name:</label><br/>
        <input type="text" :bind="self.name" /><br/>
        <label>Email:</label><br/>
        <input type="text" :bind="self.email" />
    </form>`;
}

export default function Loader() {
    const load = function() {
        // Get My:Profile self
        let s = lemonade.get('My:Profile');
        // Updates directly to the self properties
        s.name = 'John Lennon';
        s.email = 'john.lennon@beatles.com';
    }

    return render => render`
        <input type="button" value="Load the data" onclick="${load}" />
    `;
}
```

##### Private Scope

Exposing the entire component object globally can raise security concerns. Instead, securely register specific actions to update properties or execute functions using the dispatch method. 

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { set, dispatch } = lemonade;

function Profile() {
    
    set('my:profile', (s) => {
        this.name = s.name;
    });

    // Counter is created from the attribute counter
    return render => render`<form>
        <label>Name:</label><br/>
        <input type="text" :bind="${this.name}" /><br/>
    </form>`;
}

function Loader() {

    const update = function() {
        // Send new values to another component using the dispatcher
        dispatch('my:profile', {
            name: 'John Lennon'
        });
    }
    return render => render`<input type="button" value="Load" onclick="${update}" />`;
}
lemonade.render(Profile, document.getElementById('root'));
lemonade.render(Loader, document.getElementById('root'));
</script>
</html>
```
```javascript
import { set, dispatch, onchange } from 'lemonadejs';

export default function Profile() {
    
    set('profile:updateName', (s) => {
        this.name = s.name;
    });

    // Counter is created from the attribute counter
    return render => render`<form>
        <label>Name:</label><br/>
        <input type="text" :bind="${this.name}" /><br/>
    </form>`;
}

export default function Loader() {
    
    const update = function() {
        // Send new values to another component using the dispatcher
        dispatch('profile:updateName', {
            name: 'John Lennon'
        });
    }
    return render => render`
        <input type="button" value="Load" onclick="${update}" />
    `;
}
```


### Persistence

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
    lemonade.set('persistence:test', function(s) {
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
        lemonade.dispatch('persistence:test', {
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

## Summary of This Chapter

This chapter explores key aspects of Sugar:

- **Global Access**: Leverage Sugar's set and get methods to make `self` properties globally accessible across components.
- **Action Registration**: Register actions to make them available across different components.
- **Data Dispatchers**: Execute cross-component actions while preserving their private scope and ensuring security and encapsulation.
- **Persistent State**: Utilize the persistence flag to retain the latest data state.


## What's Next?

Learn more about unit testing with LemonadeJS.\
\
[Unit testing](/docs/tests){.button}
