/**
 * Lemonadejs v2.8.0
 *
 * Website: https://lemonadejs.net
 * Description: Create amazing web based reusable components.
 *
 * This software is distribute under MIT License
 *
 * Roadmap
 * - @bind dentro do drodpown jsuites nao seta o valor inicial se o bind tiver valor
 *   class="test {{anotherClass}}"
 * - existing tags
 */

import lemonade from "./lemonade";

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.tester = factory();
}(this, (function () {

    let testIndex = 0;

    return function(title, parser) {
        let self = {};
        let root = document.createElement('div');
        let expectedValue = null;
        let resultValue = null;
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

        if (ret === true) {
            console.log(testIndex + '. ' + title + ' has passed\n\n');
        } else {
            console.error(testIndex + '. ' + title + ' has not passed. Return '+ resultValue + ' Expected ' + expectedValue + '\n\n');
        }
        testIndex++;
    }

})));