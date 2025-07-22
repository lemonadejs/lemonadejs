title: Getting Started with LemonadeJS
keywords: LemonadeJS, JavaScript library, reactive programming, two-way data binding, frontend development, micro-library, version 5 documentation
description: LemonadeJS is a lightweight reactive JavaScript micro-library designed for building agnostic components, web components, and efficient web applications.
canonical: https://lemonadejs.com/docs/getting-started

# Getting Started with LemonadeJS

LemonadeJS v5 is a lightweight, micro-reactive JavaScript library for building platform-agnostic components. With just 5.5KB compressed and zero dependencies, it delivers high performance and flexibility through an abstract reactive layer on top of your favorite framework. Build anything from simple components to complex web applications using pure JavaScript, TypeScript, or JSX, powered by two-way data binding, component communication, and built-in hooks.

## Installation

Start using the reactive LemonadeJS library by choosing one of the following installation methods that best fit your project's requirements:

### NPM Package

For those integrating LemonadeJS using NPM:

```bash
npm install lemonadejs@5
```

### CDN

Add LemonadeJS to your HTML files directly by including the following script tag:

```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs@5/dist/lemonade.min.js"></script>
```


### Source Code (MIT)

Access the complete source code on GitHub to customize, explore, or contribute to the LemonadeJS project:

[https://github.com/lemonadejs/lemonadejs](https://github.com/lemonadejs/lemonadejs){.button}


## Create a New App From the Command Line

### Quick start

Get started with LemonadeJS by creating a new project:

```bash
# Create a new project
npx @lemonadejs/create my-app

# Navigate to project directory
cd my-app

# Start development server
npm run dev
```


## The Core Concept of LemonadeJS

At the core of LemonadeJS is the {this} object—also aliased as {self}—which is the foundation for each component’s properties and methods. This object is central to the framework’s reactivity, enabling seamless updates and interactions within the application.


### Data Binding:

In LemonadeJS, data binding is both intuitive and efficient. When you declare a property within the {self} object and utilize it within your template, LemonadeJS automatically sets up observers. These observers are responsible for syncing any changes in your property's value with the corresponding HTML element in the Document Object Model (DOM).


```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Hello() {
    this.count = 0;
    // Count down every second
    setInterval(() => {
        this.count++;
    }, 1000);
    // Component template
    return render => render`<p>Count: ${this.count}</p>`;
}
lemonade.render(Hello, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export function Hello() {
    this.count = 0;
    // Count down every second
    setInterval(() => {
        this.count++;
    }, 1000);
    // Component template
    return render => render`<p>Count: ${this.count}</p>`;
}
```

## More From LemonadeJS

### Official Components

LemonadeJS provides a collection of commonly needed JavaScript reactive components and utilities to support various application development needs.

#### Testing

The official testing library for LemonadeJS offers a reliable framework to validate your components' behavior and functionality. Learn more in the [Unit Tests Documentation](/docs/tests)

#### Pico Library

A curated collection of lightweight LemonadeJS UI components, each under 2 KB and free of dependencies, designed for fast-loading and efficient web applications. Explore the [Pico Plugins Documentation](/docs/plugins)

