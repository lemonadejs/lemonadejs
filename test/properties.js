describe('Properties', () => {

    it('Tracking sub-level object properties', function() {
        // Lemonade Component
        function Component() {
            let self = this;
            self.test = {
                value: 123,
            }
            // Title and year are declared in the parent template
            return (render) => render`<div>
                <h1 :ref="self.title">{{self.test.value}}</h1>
                <input type="button" onclick="${()=>self.test.value++}" :ref="self.button" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('124', function () {
            let self = this;
            // Simulate the click in the button
            self.button.click();
            // Return the value
            return self.title.textContent;
        })
    });

    it('Detect correct property to be observed inside nested properties and actions', function() {
        function Component() {
            const self = this;
            self.test = {
                name: 'test',
                scope: ['login', 'email'],
            }
            return `<div>{{self.test.name.includes('es')}} {{self.test.scope.length}}</div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('true 2', function () {
            let self = this;
            // Return the value
            return self.el.textContent;
        })
    });

    it('Reactive properties in class or method components', function() {
        function FunctionComponent() {
            let self = this;
            let template = `<h1>{{self.value}}</h1>`;

            return lemonade.element(template, self);
        }

        class ClassComponent extends lemonade.component {
            constructor(self) {
                super(self);
            }

            render() {
                return `<h1>{{self.value}}</h1>`;
            }
        }

        function MainView() {
            let self = this;
            self.value = 100;
            return `<>
                <ClassComponent value="{{self.value}}" @ref="self.class" />
                <FunctionComponent value="{{self.value}}" @ref="self.function" />
            </>`;
        }

        // Register as a global component.
        lemonade.setComponents({FunctionComponent, ClassComponent});

        // Render the component and assert the return
        return render(MainView).assert(true, function () {
            let self = this;
            self.value++;
            return self.function.el.textContent === self.class.el.textContent;
        })
    });

    it('Property with a boolean value', function() {
        function Component() {
            let self = this;
            self.disabled = true;
            let template = `<input type="text" disabled="{{self.disabled}}"/>`;

            return lemonade.element(template, self)
        }

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;
            // Return the value
            return self.el.disabled;
        })
    });

    it('Conditional background-color based on a value of an element', function() {
        function Component() {
            let self = this;
            self.value = 1000;
            return `<input type="text" style="background-color: {{self.value.includes('-')?'red':'green'}}"/>`;
        }

        // Render the component and assert the return
        return render(Component).assert('red', function () {
            let self = this;
            // Change the value to negative
            self.value = -2000;
            // Return the value
            return self.el.style.backgroundColor;
        })
    });

    it('Property with an array value', function() {
        function Component() {
            let self = this;
            self.value = [1, 2, 3, 4];
            return `<input type="text" value="{{self.value[3]}}"/>`;
        }

        // Render the component and assert the return
        return render(Component).assert('5', function () {
            let self = this;
            // Change the value to negative
            self.value[3] = '5';
            self.refresh('value');
            // Return the value
            return self.el.value;
        })
    });

    it('Relative properties with formulas', function() {
        function Component() {
            let self = this;
            self.test = 5.22;
            return `<input type="text" value="{{Math.round(2*self.test)}}"/>`;
        }

        // Render the component and assert the return
        return render(Component).assert('20', function () {
            let self = this;
            // Change the value to negative
            self.test = 10.11;
            // Return the value
            return self.el.value;
        })
    });
});