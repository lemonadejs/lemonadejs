title: Testing LemonadeJS Components: Efficient Automation,
keywords: LemonadeJS, testing, frontend, javascript library, reactive components, automation,
description: Discover how to create and automate tests for your LemonadeJS components, ensuring high-quality, reliable web applications.

Tests
=====

LemonadeJS has incorporated Mocha and Chai for its unit testing implementation. This section will provide additional details on effectively conducting tests for your LemonadeJS components. Whether you prefer running tests through the command line or in a browser environment, you can follow the instructions provided in this section to accomplish either approach.  
  

Blue print
----------

As the example below, a test renders the component and shares the same `{self}` with a testing method. Then, it compares the result for the assertion.  
  
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
            return &#96;<h1>{{self.value}}</h1>&#96;;
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

It happens when you try to use import to load your components. This is a nodejs limitation when dealing with EMS x CommonJS.  
  
**Solution:** You need to add type="module" on your package.json before running the tests. You can remove it after running the tests.