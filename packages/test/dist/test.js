;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.test = factory();
}(this, (function () {
    // Test number
    let testIndex = 1;
    // Expected value
    let expectedValue = null;
    // Actual result
    let resultValue = null;
    // Stats
    let totals = [0,0];
    // Tests
    let tests = [];

    const Run = function(title, parser) {
        // Create a blank test
        let self = {};
        // Create root temporary element
        let root = document.createElement('div');
        // Append element to the DOM
        document.body.appendChild(root);
        // Parser
        let ret = parser(function(Component) {
            // Render LemonadeJS component
            lemonade.render(Component, root, self);

            return {
                assert: function(result, validation) {
                    try {
                        // Expected result
                        expectedValue = result;
                        // Final result
                        resultValue = validation.call(self);
                        // Assert
                        return resultValue === expectedValue;
                    } catch (e) {
                        resultValue = e;
                    }
                }
            }
        });

        // Remove temporary element from the dom
        root.remove();

        // Test result
        if (ret === true) {
            console.log(testIndex + '. ' + title + ' has passed\n\n');
            totals[0]++;
        } else {
            console.error(testIndex + '. ' + title + ' has not passed\n        Return {'+ resultValue + '} Expected {' + expectedValue + '}\n\n');
            totals[1]++;
        }

        // Index control
        testIndex++;
    }

    let Component = function(title, parser) {
        tests.push([title, parser]);
    };

    Component.run = function() {
        // Reset
        totals = [0,0];
        testIndex = 1;

        let t = null;
        while (t = tests.shift()) {
            Run(t[0],t[1]);
        }
        console.log('Done! Total number of tests: ' + (--testIndex));
        console.log('    Passed: ' + totals[0] + ' Failed: ' + totals[1]);
    }

    return Component;
})));