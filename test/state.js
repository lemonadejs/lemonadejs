describe('State', () => {

    it('Basic state with boolean value', function() {
        function Component(children, { state }) {
            let status = state(false);

            const update = () => {
                status.value = ! status.value;
            }

            return render => render`<div>
                <p><input type="checkbox" checked="${status}" /></p>
                <input type="button" value="Toggle" onclick="${update}"/>
            </div>`
        }

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;
            self.el.lastChild.click();
            return self.el.firstChild.firstChild.checked
        })
    });

    it('State with effect callback', function() {
        function Component(children, { state }) {
            this.callbackLog = [];

            let counter = state(0, (newValue, oldValue) => {
                this.callbackLog.push({ old: oldValue, new: newValue });
            });

            const increment = () => {
                counter.value++;
            };

            return render => render`<div>
                <span :ref="self.display">${counter}</span>
                <input type="button" value="+1" onclick="${increment}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            // Increment twice
            this.button.click();
            this.button.click();

            // Check effect was called with correct values
            return this.callbackLog.length === 2 &&
                   this.callbackLog[0].old === 0 &&
                   this.callbackLog[0].new === 1 &&
                   this.callbackLog[1].old === 1 &&
                   this.callbackLog[1].new === 2 &&
                   this.display.textContent === '2';
        });
    });

    it('State with string value', function() {
        function Component(children, { state }) {
            let message = state('Hello');

            const update = () => {
                message.value = 'World';
            };

            return render => render`<div>
                <p :ref="self.display">${message}</p>
                <input type="button" value="Update" onclick="${update}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert('World', function() {
            this.button.click();
            return this.display.textContent;
        });
    });

    it('State with number value', function() {
        function Component(children, { state }) {
            let count = state(10);

            const increment = () => {
                count.value += 5;
            };

            return render => render`<div>
                <span :ref="self.counter">${count}</span>
                <input type="button" value="+5" onclick="${increment}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert('15', function() {
            this.button.click();
            return this.counter.textContent;
        });
    });

    it('State with object - full replacement triggers reactivity', function() {
        function Component(children, { state }) {
            let user = state({ name: 'John', age: 25 });

            const update = () => {
                user.value = { name: 'Jane', age: 30 };
            };

            return render => render`<div>
                <p :ref="self.nameDisplay">${user.value.name}</p>
                <p :ref="self.ageDisplay">${user.value.age}</p>
                <input type="button" value="Update" onclick="${update}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            this.button.click();
            return this.nameDisplay.textContent === 'Jane' &&
                   this.ageDisplay.textContent === '30';
        });
    });

    it('State with array - full replacement triggers reactivity', function() {
        function Component(children, { state }) {
            let items = state(['apple', 'banana']);

            const update = () => {
                items.value = ['orange', 'grape', 'melon'];
            };

            return render => render`<div>
                <p :ref="self.display">Items: ${items.value.length}</p>
                <input type="button" value="Update" onclick="${update}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert('Items: 3', function() {
            this.button.click();
            return this.display.textContent;
        });
    });

    it('Functional update pattern - callback receives previous value', function() {
        function Component(children, { state }) {
            let data = state({ count: 0, items: [] });

            const update = () => {
                data.value = (prev) => {
                    prev.count += 10;
                    prev.items.push('item' + prev.count);
                    return prev;
                };
            };

            return render => render`<div>
                <p :ref="self.countDisplay">${data.value.count}</p>
                <p :ref="self.itemsDisplay">${data.value.items.length}</p>
                <input type="button" value="Update" onclick="${update}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            this.button.click();
            return this.countDisplay.textContent === '10' &&
                   this.itemsDisplay.textContent === '1';
        });
    });

    it('Multiple state variables in single component', function() {
        function Component(children, { state }) {
            let name = state('John');
            let age = state(25);
            let active = state(true);

            const updateAll = () => {
                name.value = 'Jane';
                age.value = 30;
                active.value = false;
            };

            return render => render`<div>
                <p :ref="self.nameDisplay">${name}</p>
                <p :ref="self.ageDisplay">${age}</p>
                <p :ref="self.activeDisplay">${active}</p>
                <input type="button" value="Update All" onclick="${updateAll}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            this.button.click();
            return this.nameDisplay.textContent === 'Jane' &&
                   this.ageDisplay.textContent === '30' &&
                   this.activeDisplay.textContent === 'false';
        });
    });

    // TODO: implement :bind state support
    xit('State with :bind creates two-way binding', function() {
        function Component(children, { state }) {
            let inputValue = state('');

            return render => render`<div>
                <input type="text" :bind="${inputValue}" :ref="self.input" />
                <p :ref="self.display">{{inputValue.value}}</p>
            </div>`;
        }

        // Render and test
        return render(Component).assert('hello', function() {
            // Simulate typing
            this.input.value = 'hello';
            this.input.dispatchEvent(new Event('input', { bubbles: true }));

            return this.display.textContent;
        });
    });

    it('State in expressions and conditions', function() {
        function Component(children, { state }) {
            let count = state(5);

            const increment = () => {
                count.value++;
            };

            return render => render`<div>
                <p :ref="self.display">Count is ${count.value > 10 ? 'high' : 'low'}</p>
                <input type="button" value="+1" onclick="${increment}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            // Initial should be 'low'
            let initial = this.display.textContent === 'Count is low';

            // Increment to 11
            for (let i = 0; i < 6; i++) {
                this.button.click();
            }

            // Should now be 'high'
            return initial && this.display.textContent === 'Count is high';
        });
    });

    it('State as component property', function() {
        function ChildComponent() {
            return render => render`<div>
                <p :ref="self.display">{{self.value}}</p>
            </div>`;
        }

        lemonade.setComponents({ ChildComponent });

        function ParentComponent(children, { state }) {
            let message = state('parent message');

            const update = () => {
                message.value = 'updated message';
            };

            return render => render`<div>
                <ChildComponent value="${message}" :ref="self.child" />
                <input type="button" value="Update" onclick="${update}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(ParentComponent).assert('updated message', function() {
            this.button.click();
            return this.child.display.textContent;
        });
    });

    it('State with effect - multiple updates', function() {
        function Component(children, { state }) {
            this.effectCount = 0;

            let value = state(0, (newVal, oldVal) => {
                this.effectCount++;
            });

            const multiUpdate = () => {
                value.value = 1;
                value.value = 2;
                value.value = 3;
            };

            return render => render`<div>
                <span :ref="self.display">${value}</span>
                <input type="button" value="Multi Update" onclick="${multiUpdate}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            this.button.click();
            // Each assignment triggers the effect
            return this.effectCount === 3 && this.display.textContent === '3';
        });
    });

    it('State value comparison - same value does not trigger unnecessary updates', function() {
        function Component(children, { state }) {
            this.effectCount = 0;

            let value = state(10, (newVal, oldVal) => {
                this.effectCount++;
            });

            const setSame = () => {
                value.value = 10; // Same value
            };

            return render => render`<div>
                <input type="button" value="Set Same" onclick="${setSame}" :ref="self.button" />
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            this.button.click();
            this.button.click();
            this.button.click();
            // Effect should still be called for each assignment
            return this.effectCount === 3;
        });
    });

});
