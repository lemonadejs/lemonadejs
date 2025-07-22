title: Testing LemonadeJS Components
keywords: LemonadeJS, testing, frontend, JavaScript library, reactive components, automation
description: How to create and automate tests for your LemonadeJS components, ensuring high-quality reliable web applications.

![Getting started with LemonadeJS](img/lemonadejs-bike.jpg){.right style="width: initial;"}

Tests
=====

LemonadeJS has incorporated Mocha and Chai for its unit testing implementation. This section will provide additional details on effectively conducting tests for your LemonadeJS components. Whether you prefer running tests through the command line or in a browser environment, you can follow the instructions provided in this section to accomplish either approach.  
  

Blue print
----------

As the example below, a test renders the component and shares the same `{self}` with a testing method. Then, it compares the result for the assertion.

{.ignore}
```javascript
describe('Testing lemonadejs native events', () => {
    it('Onload event', function() {
        function Component() {
            let self = this;
            self.value = null;
            self.test = 5;
            self.onload = function () {
                self.value = self.test;
            }
            return `<h1>{{self.value}}</h1>`;
        }

        // Render the component and assert the return
        return render(Component).assert('5', function () {
            let self = this;
            // Return the value
            return self.el.textContent;
        })
    });
});
```

More examples in our [GitHub repository](https://github.com/lemonadejs/lemonadejs/tree/main/tests)  
  

  

Running your tests
------------------

  

### Via NPM

Create a `./test` folder in your project root and include your test files, then you can execute:  

To run those tests via command line you will need

```bash
npm run test
```

Troubleshooting
---------------

  

### Not possible to load a file outside the module

**Issue:** Unable to Load a File Outside the Module

This problem occurs when attempting to use the 'import' statement to load your components, and it's a limitation of Node.js when dealing with the interaction between ES modules (ESM) and CommonJS.

**Solution:**

To address this issue, follow these steps:

- Open your package.json file.
- Add the 'type' field with the value 'module' as shown below:

```{ "type": "module", // ... other package.json configurations }```
- Save the package.json file.
- Run your tests.
- After running the tests, you can remove the 'type' field from package.json if needed.

This solution allows for proper module loading when working with ES modules and CommonJS in Node.js.
