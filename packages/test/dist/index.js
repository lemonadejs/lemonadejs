/**
 * Lemonadejs unit tests v1.0.0
 *
 * Website: https://lemonadejs.net
 * Description: Create amazing web based reusable components.
 *
 * This software is distribute under MIT License
 */

import chalk from 'chalk';

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
                    console.log(chalk.green.bold(' has passed\n'));
                    totals[0]++;
                } else {
                    console.log(chalk.red.bold('has not passed'));
                    console.log('        ' + chalk.red('Return') + ' {'+ t[2] + '} ' + chalk.green('Expected') + ' {' + t[3] + '}\n');
                    totals[1]++;
                }
            }

            console.log('\nDone! Total number of tests: ' + (testIndex));
            console.log('    ' + chalk.green.bold('Passed: ' + totals[0]) + '   ' + chalk.red.bold('Failed: ' + totals[1]));
        } catch(e) {
            console.log('');
            console.error(
                chalk.bgRed.bold(" ERROR "),
                chalk.red.bold('Something weng wrong with the test.\n\n'),
                e
            );
        }
    }

    return Component;
}

export default Test();