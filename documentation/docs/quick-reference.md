title: LemonadeJS Quick Reference  
keywords: LemonadeJS, quick reference, frontend development, JavaScript library, reactive programming, documentation, UI components  
description: A concise, one-page reference covering the essentials of LemonadeJS for building reactive UI components.
canonical: https://lemonadejs.com/docs/quick-reference

# LemonadeJS Quick Reference

## Core Concepts

LemonadeJS is a lightweight, reactive JavaScript library (~5.6 KB gzipped) designed for creating modular, efficient UI components with minimal syntax. Below is an overview of its core features and usage.

## Features

### Templates
- Utilizes template literals for rendering and dynamic updates.
- Updates only DOM elements impacted by state changes.
- Employs placeholders like `{{this.property}}` for reactive data binding.

### Context Object `this` (or `self`)
- The `this` object encapsulates all properties and methods of a component.
- **Special Attributes**:
  - `el`: References the component's root DOM element.
  - `refresh`: Re-renders specific properties, the view, or the entire component.
  - `parent`: References the parent component (available in loop contexts only).

### Attributes
- **`:ref`**: Assigns a DOM element reference to `this`.
- **`:bind`**: Establishes two-way data binding between a DOM element and a property.
- **`:ready`**: Executes a function once the DOM element is mounted.
- **`:loop`**: Iterates over an array to render dynamic lists.

## Methods

### Core Functions
| Method               | Description                                                       |
|----------------------|-------------------------------------------------------------------|
| `render`             | Renders a component into a specified DOM root.                    |
| `apply`              | Attaches a `this` object to an existing DOM element.              |
| `setComponents`      | Registers components for global accessibility.                    |
| `createWebComponent` | Converts a LemonadeJS component into a web component.             |

### Sugar Functions
| Method      | Description                                                       |
|-------------|-------------------------------------------------------------------|
| `set`       | Stores a `this` object or dispatcher for component-wide access.   |
| `get`       | Retrieves a `this` object from the Sugar container.               |
| `dispatch`  | Propagates data updates across components.                        |

## Events
- **`onload`**: Triggered when a component mounts to the DOM.
- **`onchange`**: Triggered when a reactive property updates.

## State
- Manages private reactive properties for component-level data.
- Automatically refreshes DOM elements on state changes.

## Advanced Rendering
- Supports **`render => render`** syntax for dynamic rendering.
- Integrates with JSX via the LemonadeJSX Babel plugin.

## Testing
Easily create unit tests for LemonadeJS components.  
[Learn More About Testing](/docs/tests)

## Examples

### Basic Examples
- [Lamp](/docs/examples/lamp)
- [Counter](/docs/examples/counter)
- [Color Generator](/docs/examples/color-generator)

### Advanced Examples
- [Hangman Game](/docs/examples/hangman)
- [Tic-Tac-Toe Game](/docs/examples/tic-tac-toe)

## Pico Extensions
Optimized components under 1.8 KB with zero dependencies:
- [List](/docs/plugins/list): Transforms arrays into searchable, paginated lists.
- [Rating](/docs/plugins/rating): Implements a reactive star rating system.
- [Router](/docs/plugins/router): Provides lightweight SPA routing.
- [Signature](/docs/plugins/signature): Offers an optimized signature pad.

## Extensions
- [Image Cropper](/docs/plugins/image-cropper): A LinkedIn-style photo uploader and cropper.

For suggestions, visit our [GitHub page](https://github.com/lemonadejs/lemonadejs) or email us at contact@jspreadsheet.com.