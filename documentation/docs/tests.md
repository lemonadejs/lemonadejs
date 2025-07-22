title: Testing LemonadeJS Components
keywords: LemonadeJS, testing, frontend, JavaScript library, reactive components, automation
description: How to create and automate tests for your LemonadeJS components, ensuring high-quality reliable web applications.
canonical: https://lemonadejs.com/docs/tests

# Tests

LemonadeJS uses Mocha and Chai for unit testing, providing a streamlined way to test your components. You can run tests via `command line` or a browser environment.

## Overview

### Testing Blueprint

Tests in LemonadeJS follow a simple pattern where the test method shares the same context ('this') as the component, enabling direct access to component properties and state during assertions:

{.ignore}
```javascript
describe('Testing lemonadejs native events', () => {
    it('Onload event', function() {
        function Component() {
            this.value = null;
            this.test = 5;
            this.onload = () => {
                this.value = this.test;
            }
            return render => render`<h1>${this.value}</h1>`;
        }

        // Render the component and assert the return
        return render(Component).assert('5', function () {
            return this.el.textContent;
        })
    });
});
```

More examples in our [GitHub repository](https://github.com/lemonadejs/lemonadejs/tree/main/tests)  
  

## Running your tests

### Via NPM

Create a `test`{.highlight} directory in your project root and add your test files. Run tests using:  

```bash
npm run test
```

### Troubleshooting

When running tests via command line, you might encounter "Unable to Load a File Outside the Module" error. This occurs due to Node.js module system constraints when mixing ES Modules (ESM) and CommonJS modules. Make sure your testing configuration properly handles module imports according to your project's module system.

