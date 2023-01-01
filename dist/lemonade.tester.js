/**
 * Lemonadejs tester v1.0.0
 *
 * Website: https://lemonadejs.net
 * Description: Create amazing web based reusable components.
 *
 * This software is distribute under MIT License
 */

const lemonade = require("./lemonade");

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.tester = factory();
}(this, (function () {

    let testIndex = 1;

    return function(title, parser, options) {
        let self = {};
        // Create root temporary element
        let root = document.createElement('div');
        // Append element to the DOM
        if (options && options.browser) {
            document.body.appendChild(root);
        }
        // Controls
        let expectedValue = null;
        let resultValue = null;
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
        if (options && options.browser) {
            root.remove();
        }

        // Overview
        var overview = [0,0];
        // Test result
        if (ret === true) {
            console.log(testIndex + '. ' + title + ' has passed\n\n');
            overview[0]++;
        } else {
            console.error(testIndex + '. ' + title + ' has not passed\n        Return {'+ resultValue + '} Expected {' + expectedValue + '}\n\n');
            overview[1]++;
        }

        console.log('Total number of tests: ' + testIndex);
        console.log('       Passed: ' + overview[0] + ' Failed: ' + overview[1]);

        // Index control
        testIndex++;
    }

})));