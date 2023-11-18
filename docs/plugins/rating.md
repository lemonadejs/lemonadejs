title: Engaging LemonadeJS Rating Component for User Feedback
keywords: LemonadeJS, rating, component, frontend, javascript library, javascript, interactive, user feedback
description: LemonadeJS Rating Component is a user-friendly solution for quickly collecting user feedback and ratings in HTML forms.

Rating
======
`Pico Library`{.jtag .black}

This library has less than 2 KBytes  
  
The LemonadeJS star rating plugin is a micro JavaScript component that implements the five star rating.  

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/rating
```

### Attributes

| Attribute | Description |
| --- | --- |
| name?: String | The name of the component |
| number?: Number | The number of stars. Default 5. |
| value?: Number | The initial value. Default null. |

### Events

| Attribute | Description |
| --- | --- |
| onchange?: Function | When the value of the component changes  <br>`self.onchange(value: Number) => void` |



Examples
--------

Changing the `self.value` will trigger the view updates. If you set the `self.value` with the same current value, that will reset the value.  
  
### Basic example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/rating/dist/index.min.js"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<div id='root'></div>
<script>
const Component = function() {
    const self = this;

    self.plus = () => {
        self.number++;
    }
    self.minus = () => {
        self.number--;
    }
    self.reset = () => {
        self.value = 1;
    }
    self.change = (newValue) => {
        console.log('New value', newValue);
    }

    self.number = 5;
    self.value = 3;

    return `<>
        <p><Rating :value="self.value" :number="self.number" onchange="self.change" /></p>
        <input type="button" value="Value=1" onclick="self.reset" />
        <input type="button" value="Add star" onclick="self.plus" />
        <input type="button" value="Remove star" onclick="self.minus" />
    </>`;
}
// Render component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
// For installation: % npm install @lemonadejs/rating
// Add to your HTML: <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
import lemonade from "lemonadejs";
import Rating from "@lemonadejs/rating";

export default function Component() {
    const self = this;

    self.plus = () => {
        self.number++;
    }
    self.minus = () => {
        self.number--;
    }
    self.reset = () => {
        self.value = 1;
    }
    self.change = (newValue) => {
        console.log('New value', newValue);
    }

    self.number = 5;
    self.value = 3;

    return `<div>
        <p><Rating :value="self.value" :number="self.number" onchange="self.change" /></p>
        <input type="button" value="Value=1" onclick="self.reset" />
        <input type="button" value="Add star" onclick="self.plus" />
        <input type="button" value="Remove star" onclick="self.minus" />
    </div>`;
}
```
```jsx
// For installation: % npm install @lemonadejs/rating
// Add to your HTML: <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
import React, { useRef, useEffect } from "react";
import Rating from "@lemonadejs/rating";

export default function Component() {
    const divRef = useRef();
    const ratingRef = useRef();

    useEffect(() => {
        if (divRef.current && !divRef.current.innerText) {
            ratingRef.current = Rating(divRef.current, {
                value: 3,
                number: 5,
                onchange: function(newValue) {
                    console.log('New value: ', newValue)
                }
            });
        }
    }, []);

    const reset = function () {
        ratingRef.current.value = 3
    };

    const plus = function () {
        ratingRef.current.number++
    };

    const minus = function () {
        ratingRef.current.number--
    };
    
    return (<>
        <div ref={divRef}></div>
        <button onClick={reset}>Value=1</button>
        <button onClick={plus}>Add Star</button>
        <button onClick={minus}>Remove Star</button>
    </>)
}
```

Related content
---------------

*   [Simple star rating implementation](/examples/rating)
