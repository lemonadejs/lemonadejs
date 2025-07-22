title: LemonadeJS Changelog and Roadmap  
keywords: LemonadeJS, JavaScript library, reactive programming, two-way data binding, frontend development, micro-library, version 5 documentation  
description: The latest updates on LemonadeJS and the features we will focus on next.  
canonical: https://lemonadejs.com/docs/changelog

# Changelog

## Roadmap

- Enhanced `style` property handling for improved programmatic style management.
- New `render` property for conditional rendering, supporting dynamic content updates based on conditions.
- Support for interpolated property attribution.

## Updates

### 5.1.3

- Convert null to empty strings in templates;
- Prevent redundant onchange calls during the two-way binding element sync;

### 5.1.2 

- New custom event helper with creation and dispatch.

### 5.1.1

- Prevent conflicts between LemonadeJS's onchange and component-level onchange handlers.
- Introduce a global currentLemon reference to ensure correct onchange and onload behavior across different versions.

### 5.0.9

- Added a third argument to setPath to return form element values filtered by their visibility. 

### 5.0.6

- Fixed lm-bind event declaration when used in combination with lm-path;
- Prevented errors when lm-path is used without a preceding setPath declaration;

### 5.0.4

- Introduced new form objects with setPath and lm-path to simplify HTML form data management.
- Added conditional rendering with lm-render to enable cleaner and more intuitive user interfaces.

### 5.0.0

- Introduced state management for private and reactive properties;
- Added event hooks for better encapsulation;
- Replaced templates with JSON structures, using children as component arguments;
- Improved support for dynamic content rendering;
- Optimized the DOM rendering process for better efficiency;
- Reintroduced lm- prefixes for special properties and type casting;
- Added support for JSX via the LemonadeJSX Babel plugin;
- Added a new method to force tracking of properties not used in the template;
- Introduced new Form Object features using :path and setPath;

### 4.3.3

- Fix in special characters;

### 4.2.0

- Added a method for creating web components.

### 4.1.0

- Prevented redundant changes by ignoring reassignments of properties to the same value.

### 4.0.0

- Enabled tracking for complex nested objects, including arrays.
- Adopted Content Security Policy (CSP)-compliant syntax.
- Enhanced binding of literals in templates to DOM attributes.

### 3.5.0

- Introduced the `:` prefix for attributes to dynamically receive references.

### 3.0.0

- Added support for partial updates in properties with dynamic values.
- Improved handling of text nodes alongside tags in templates.
- Enabled tracking for sub-level nested object properties.
- Introduced two-way data binding with parent components.
- Added unit tests for increased reliability.

### 2.8.9

- Added the `self.refresh` method for rebuilding components while retaining state.
- Supported the `:src` attribute with a default property.
- Enabled self-closing tags in web components.
- Derived self attributes directly from classes.

### 2.7.2

- Introduced `lm-ready`, `lm-loop`, `lm-ref`, and `lm-bind` as alternatives to `:ready`, `:loop`, `:ref`, and `:bind`.
- Made components case-insensitive.
- Simplified binding for custom components.

### 2.4.2

- Added text translation support through `lemonade.dictionary` and `lemonade.translate`.
- Introduced a method for evaluation in templates.

### 2.2.4

- Made the event object (`e`) accessible directly in templates.

### 2.2.0

- Added support for tables.

### 2.1.13

- Enabled `:loop` on native HTML tags.
- Prioritized `val()` in setting attributes.
- Introduced `self.parent` as a reserved property for accessing the parent component's state.

### 2.1.7

- Introduced a global queue for managing state.
- Added the Pico library and Sugar Common Container.
- Reserved `self.el` to return the root element of a component.
- Enabled real-time templates for custom elements.
- Supported extensions and templating for child elements in custom components.

### 2.0.6

- Introduced the `:loop` property for dynamic iteration.
- Improved integration with components.
- Enhanced templating for custom components.

### 1.0.0

- Introduced `:bind`, `:ready`, and `:ref` magic properties.
