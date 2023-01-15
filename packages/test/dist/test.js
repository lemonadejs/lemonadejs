;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.test = factory();
}(this, (function () {
    // Tests
    let tests = [];

    const Run = function(definition) {
        let title = definition[0];
        let parser = definition[1];
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
                    // Expected result
                    definition[2] = result;
                    // Final result
                    definition[3] = validation.call(self);
                    // Assert
                    return definition[2] === definition[3];
                }
            }
        });

        // Remove temporary element from the dom
        root.remove();

        return ret;
    }

    let Component = function(title, parser) {
        tests.push([title, parser, null, null]);
    };

    Component.run = function() {
        // Reset
        let totals = [0,0];
        let testIndex = 0;

        try {
            // Temporary
            let t = null;
            // Return
            let r = null;
            while (t = tests.shift()) {
                // Index control
                testIndex++;
                // Which test is this
                console.log(testIndex + '. ' + t[0]);
                // Execute test
                r = Run(t);
                // Result
                if (r === true) {
                    console.log(' has passed\n\n');
                    totals[0]++;
                } else {
                    console.error(' has not passed. Return {'+ t[2] + '} Expected {' + t[3] + '}\n\n');
                    totals[1]++;
                }
            }
            console.log('Done! Total number of tests: ' + (testIndex));
            console.log('    Passed: ' + totals[0] + ' Failed: ' + totals[1]);
        } catch(e) {
            console.log('');
            console.error('ERROR');
            console.error('Something weng wrong with the test.\n\n');
            console.error(e);
        }
    }

    return Component;
})));