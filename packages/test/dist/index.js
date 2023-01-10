/**
 * Lemonadejs unit tests v1.0.0
 *
 * Website: https://lemonadejs.net
 * Description: Create amazing web based reusable components.
 *
 * This software is distribute under MIT License
 */

function Test() {
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
                    try {
                        // Expected result
                        definition[2] = result;
                        // Final result
                        definition[3] = validation.call(self);
                        // Assert
                        return definition[2] === definition[3];
                    } catch (e) {
                        definition[3] = e;
                    }
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
                    console.error(' has not passed. Return {'+ definition[2] + '} Expected {' + definition[3] + '}\n\n');
                    totals[1]++;
                }
            }
            console.log('Done! Total number of tests: ' + (--testIndex));
            console.log('    Passed: ' + totals[0] + ' Failed: ' + totals[1]);
        } catch(e) {
            console.log('Something weng wrong with the test.\n\n', e);
        }
    }

    return Component;
}

export default Test();