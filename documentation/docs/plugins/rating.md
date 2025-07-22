title: JavaScript Rating
keywords: LemonadeJS, rating, component, frontend, javascript library, javascript, interactive, user feedback
description: LemonadeJS Rating Component is a user-friendly solution for quickly collecting user feedback and ratings in HTML forms.
canonical: https://lemonadejs.com/docs/plugins/rating

# JavaScript Rating

`Pico Library`{.jtag .black .framework-images}

{.small}
This library has less than 2 KBytes

The LemonadeJS Star Rating plugin is a micro JavaScript component that provides a customizable five-star rating system. It enables expressive and flexible ratings for products or services, going beyond basic numeric feedback.  

## Documentation

### Installation

```bash
npm install @lemonadejs/rating
```

### Material icons

It requires Google Material Icons.

{.ignore}
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### Attributes

| Attribute         | Description                               |
|-------------------|-------------------------------------------|
| `name?: String`   | The name of the component.                |
| `number?: Number` | The number of stars. The default is `5`.  |
| `value?: Number`  | The initial value. The default is `null`. |

### Events

| Event                | Description                                   |
|----------------------|-----------------------------------------------|
| `onchange: Function` | Triggered when the component's value changes. |

## Examples

Updating `this.value` will automatically update the view. If you set `this.value` to its current value, the component will reset to its initial state.
  
  
### Basic example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/rating/dist/index.min.js"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<div id='root'></div>

<script>
let { onchange } = lemonade;

function Component() {

    const plus = () => {
        this.number++;
    }
    const minus = () => {
        this.number--;
    }
    const reset = () => {
        this.value = 1;
    }
    const change = (newValue) => {
        console.log('New value', newValue);
    }

    this.number = 5;
    this.value = 3;

    return render => render`<>
        <Rating value="${this.value}" number="${this.number}" onchange="${change}" />
        <br>
        <input type="button" value="Value=1" onclick="${reset}" />
        <input type="button" value="Add star" onclick="${plus}" />
        <input type="button" value="Remove star" onclick="${minus}" />
    </>`;
}
// Render component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from "lemonadejs";
import Rating from "@lemonadejs/rating";

export default function Component() {
    const plus = () => {
        this.number++;
    }
    const minus = () => {
        this.number--;
    }
    const reset = () => {
        this.value = 1;
    }
    const change = (newValue) => {
        console.log('New value', newValue);
    }

    this.number = 5;
    this.value = 3;

    return render => render`<>
        <Rating value="${this.value}" number="${this.number}" onchange="${change}" />
        <br>
        <input type="button" value="Value=1" onclick="${reset}" />
        <input type="button" value="Add star" onclick="${plus}" />
        <input type="button" value="Remove star" onclick="${minus}" />
    </>`;
}
```
```jsx
// Add to your HTML: <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
import React, { useRef } from "react";
import Rating from "@lemonadejs/rating/dist/react";

export default function Component() {
    const component = useRef();

    const reset = function () {
        component.current.value = 1;
    };

    const plus = function () {
        component.current.number++;
    };

    const minus = function () {
        component.current.number--;
    };

    const handleChange = function (v) {
        console.log('New value: ', v);
    }
    
    return (<div>
        <Rating value={3} number={5} onchange={handleChange} ref={component} />
        <button onClick={reset}>Value=1</button>
        <button onClick={plus}>Add Star</button>
        <button onClick={minus}>Remove Star</button>
    </div>)
}
```
```vue
<!-- Add to your HTML: <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"> -->
<template>
    <Rating :value="3" :number="5" :onchange="handleChange" ref="component" />
    <button @click="reset">Value=1</button>
    <button @click="plus">Add Star</button>
    <button @click="minus">Remove Star</button>
</template>

<script>
import Rating from '@lemonadejs/rating/dist/vue';

export default {
name: 'App',
components: {
    Rating,
},
methods: {
    reset: function () {
        this.$refs.component.current.value = 1;
    },
    plus: function () {
        this.$refs.component.current.number++;
    },
    minus: function () {
        this.$refs.component.current.number--;
    },
    handleChange: function (v) {
        console.log('New value: ', v)
    }
}
};
</script>
```

## Related content


* [Simple Star Rating Component Implementation](/docs/examples/rating)
