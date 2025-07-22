title: Managing State with LemonadeJS
keywords: LemonadeJS, state management, reactive programming, JavaScript library, frontend development, dynamic UI, reusable components, hooks
description: Discover how to use LemonadeJS state to create private, reactive values that dynamically update your component templates, enhancing reactivity and performance.
canonical: https://lemonadejs.com/docs/state

# State

The `state`{.highlight} method creates a reactive state object that automatically triggers UI updates whenever the state changes.

## Overview

LemonadeJS implements state management differently from frameworks like React and Lit. It maintains a list of micro-reactive events tied directly to the DOM or component attribute references. These references are updated immediately when the state changes, without needing reconciliation or re-rendering the template. For example:

## Documentation

| Method  | Description                                                                                                                                                                                                                                                                                       |
|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `state` | @param \{any} value - initial state value<br>@param \{Function} Effect - Optional callback function that runs when the state value changes. Receives the new value and the old value as parameters.<br>@return \{Function} state<br>`state(value: any, effect?: Function) => state{}`{.highlight} |

### Updating the State

The state implements a getter and setter for the property value, this way you can change the state by simple calling the property value.

{.ignore}
```javascript
let color = state('orange');
// To update the color you can use the property value
color.value = 'red';
```

#### Working Example

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;

function Test() {
    let status = state(true);

    const update = () => {
        status.value = ! status.value;
    }

    return render => render`<div>
        <p><Switch value="${status}" /></p>
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    let status = state(true);

    const update = () => {
        status.value = ! status.value;
    }

    return render => render`<div>
        <Switch value="${status}" /><br/>
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
```

### State Effect

The state method accepts an optional effect callback that runs when the state value changes. This callback allows you to perform side effects in response to state updates.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;

function Test() {
    let status = state(true, (newValue, oldValue) => {
        // Value has been re-defined
        console.log(newValue)
    });

    const update = () => {
        status.value = ! status.value;
    }

    return render => render`<div>
        <p><Switch value="${status}" /></p>
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    let status = state(true, (newValue, oldValue) => {
        // Value has been re-defined
        console.log(newValue)
    });

    const update = () => {
        status.value = ! status.value;
    }

    return render => render`<div>
        <Switch value="${status}" /><br/>
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
```


### Reactivity in Objects

LemonadeJS prioritizes performance by using raw references for objects and arrays, avoiding the overhead of Proxy tracking. On those cases to trigger reactivity, use the refresh method to manually re-render the references in the view.

#### Reactive 

Updating the entire state value will automatically trigger reactivity:

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;

function Test() {
    // Default option
    let palette = state([
        ["#001969","#233178","#394a87","#4d6396","#607ea4","#7599b3"],
        ["#00429d","#2b57a7","#426cb0","#5681b9","#6997c2","#7daeca"],
        ["#3659b8","#486cbf","#597fc5","#6893cb","#78a6d1","#89bad6"],
        ["#003790","#315278","#48687a","#5e7d81","#76938c","#8fa89a"]
    ]);

    const updatePalette = function() {
        palette.value = [
            ["#840f38","#b60718","#ff0c0c","#fd491c","#faa331","#ffc73a"],
            ["#5f0b28","#930513","#ef0000","#fa3403","#f9991b","#ffc123"],
            ["#370617","#6a040f","#d00000","#dc2f02","#f48c06","#ffba08"],
            ["#320615","#61040d","#bc0000","#c82a02","#db7f06","#efab00"],
        ];
    }

    return render => render`<div>
        <input type="text" :ref="this.input" />
        <Color palette="${palette}" :input="this.input" />
        <input type="button" value="Update Palette" onclick="${updatePalette}" />
    </div>`;
}
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    // Default option
    let palette = state([
        ["#001969","#233178","#394a87","#4d6396","#607ea4","#7599b3"],
        ["#00429d","#2b57a7","#426cb0","#5681b9","#6997c2","#7daeca"],
        ["#3659b8","#486cbf","#597fc5","#6893cb","#78a6d1","#89bad6"],
        ["#003790","#315278","#48687a","#5e7d81","#76938c","#8fa89a"]
    ]);

    const updatePalette = function() {
        palette.value = [
            ["#840f38","#b60718","#ff0c0c","#fd491c","#faa331","#ffc73a"],
            ["#5f0b28","#930513","#ef0000","#fa3403","#f9991b","#ffc123"],
            ["#370617","#6a040f","#d00000","#dc2f02","#f48c06","#ffba08"],
            ["#320615","#61040d","#bc0000","#c82a02","#db7f06","#efab00"],
        ];
    }

    return render => render`<div>
        <input type="text" :ref="this.input" />
        <Color palette="${palette}" :input="this.input" />
        <input type="button" value="Update Palette" onclick="${updatePalette}" />
    </div>`;
}
```

#### Functional Update Pattern

The Functional Update pattern in LemonadeJS provides a way to update the state based on its previous values using a callback function. This pattern is handy when the new state depends on the current state.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;

function Test() {
    // Default option
    let palette = state([
        ["#001969","#233178","#394a87","#4d6396","#607ea4","#7599b3"],
        ["#00429d","#2b57a7","#426cb0","#5681b9","#6997c2","#7daeca"],
        ["#3659b8","#486cbf","#597fc5","#6893cb","#78a6d1","#89bad6"],
        ["#003790","#315278","#48687a","#5e7d81","#76938c","#8fa89a"]
    ]);

    const updatePalette = function() {
        // Update a single value does not trigger reaction
        palette.value = (prev) => {
            prev[0][0] = '#000000';
            return prev;
        }
    }

    return render => render`<div>
        <input type="text" :ref="this.input" />
        <Color palette="${palette}" :input="this.input" />
        <input type="button" value="Update Palette" onclick="${updatePalette}" />
    </div>`;
}
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    // Default option
    let palette = state([
        ["#001969","#233178","#394a87","#4d6396","#607ea4","#7599b3"],
        ["#00429d","#2b57a7","#426cb0","#5681b9","#6997c2","#7daeca"],
        ["#3659b8","#486cbf","#597fc5","#6893cb","#78a6d1","#89bad6"],
        ["#003790","#315278","#48687a","#5e7d81","#76938c","#8fa89a"]
    ]);

    const updatePalette = function() {
        // Update a single value does not trigger reaction
        palette.value = (prev) => {
            prev[0][0] = '#000000';
        }
    }

    return render => render`<div>
        <input type="text" :ref="this.input" />
        <Color palette="${palette}" :input="this.input" />
        <input type="button" value="Update Palette" onclick="${updatePalette}" />
    </div>`;
}
```

#### Explicit State Synchronization

In specific performance-critical applications, applying multiple state changes is beneficial before triggering a single view refresh. LemonadeJS provides an explicit state synchronization pattern that gives developers precise control over when updates occur. 

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>

let { state } = lemonade;

function GameState() {
    let game = state({
        player: { x: 0, y: 0, health: 100, score: 0 },
        enemies: [
            { id: 1, x: 10, y: 20, health: 50 },
            { id: 2, x: 30, y: 40, health: 50 }
        ]
    });

    const handleCollision = () => {
        // Multiple state changes
        game.value.player.health -= 10;
        game.value.player.score += 50;
        game.value.enemies[0].health -= 25;

        // Single refresh triggers one re-render
        this.refresh();
    }

    return render => render`<div>
        <p>Player Health: ${game.value.player.health}</p>
        <input type="button" onclick="${handleCollision}" value="Simulate Collision" />
    </div>`;
}
lemonade.render(GameState, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    let game = state({
        player: { x: 0, y: 0, health: 100, score: 0 },
        enemies: [
            { id: 1, x: 10, y: 20, health: 50 },
            { id: 2, x: 30, y: 40, health: 50 }
        ]
    });

    const handleCollision = () => {
        // Multiple state changes
        game.value.player.health -= 10;
        game.value.player.score += 50;
        game.value.enemies[0].health -= 25;

        // Single refresh triggers one re-render
        this.refresh();
    }

    return render => render`<div>
        <p>Player Health: ${game.value.player.health}</p>
        <input type="button" onclick="${handleCollision}" value="Simulate Collision" />
    </div>`;
}
```

## Reactive Component Properties

Component properties defined on `this` are automatically reactive when used in templates and accessible through the component hierarchy. The `state`{.highlighted} provides private, reactive values scoped within the component.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Test() {
    // Default value
    this.status = true;
    // Method to toggle the value
    const update = () => {
        this.status = ! this.status;
    }

    return render => render`<div>
        <div>test: ${this.status}</div>
        <p><Switch :bind="${this.status}" /></p>
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Test() {
    // Default value
    this.status = true;
    // Method to toggle the value
    const update = () => {
        this.status = ! this.status;
    }

    return render => render`<div>
        <div>test: ${this.status}</div>
        <Switch :bind="${this.status}" /><br/>
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
```

## Single Reference Binding Limitation

In LemonadeJS, updating a self property overrides the DOM attribute with a single reference value, discarding any interpolated text or additional references in the original binding.

{.ignore}
```javascript
export default function Test() {
    let status = state(true);

    const update = () => {
        status.value = ! status.value;
    }

    // The result of value after the update will be only the boolean value removing the text.
    return render => render`<div>
        <Test value="Status: ${status}" />
        <input type="button" value="Toggle" onclick="${update}"/>
    </div>`
}
```


## Comparison

A quick comparison with React.

| Aspect                            | LemonadeJS State                                                                          | React State                                                                                                              |
|-----------------------------------|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| **Declaration**                   | State in LemonadeJS is defined as private, reactive properties within the component.      | State in React is managed via the `useState` hook (functional components) or `this.state` (class components).            |
| **Reactivity Mechanism**          | LemonadeJS employs micro-events tied to state properties for automatic reactivity.        | React batches state updates and uses a virtual DOM to compute differences and update the real DOM.                       |
| **Mutability**                    | State in LemonadeJS is mutable, with direct updates triggering DOM changes.               | React state is immutable, requiring updates via `setState` or the `useState` updater function.                           |
| **Complexity**                    | LemonadeJS offers a lightweight, straightforward approach without a virtual DOM.          | React involves a more intricate system with a virtual DOM and reconciliation process.                                    |
| **Usage**                         | LemonadeJS state is private and encapsulated within the component’s scope.                | React state can be shared across components using Context API or libraries like Redux.                                   |

### What's Next?

Explore how LemonadeJS handles dynamic references in templates.

- [Dynamic References](/docs/references)

