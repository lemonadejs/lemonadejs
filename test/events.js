describe('Events', () => {

    it('Updating a property from the onchange', function() {
        function Component(children, { onchange }) {
            this.value = null;
            this.test = 5;
            onchange(() => {
                this.value = this.test;
            });
            return render => render`<input type="text" value="${this.test}"/>`;
        }

        // Render the component and assert the return
        return render(Component).assert(2, function () {
            // Change the value to negative
            this.test = 2;
            // Return the value
            return this.value;
        })
    });

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

    it('Nested events', function() {
        function Component() {
            this.value = 1;
            this.test = {
                click: () => {
                    this.value++;
                }
            };

            // Title and year are declared in the parent template
            return render => render`<div>
                <h1>${this.value}</h1>
                <input type="button" onclick="self.test.click" :ref="self.input" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('2', function () {
            let self = this;
            self.input.click()
            // Return the value
            return self.el.textContent;
        })
    });

    let { events } = lemonade;

    it('CustomEvents: create and dispatch with custom props', function() {
        function Component(children, { onload }) {
            const self = this;

            onload(() => {
                // Add the event `test` to my root element
                self.el.addEventListener('test', function(e) {
                    self.el.title = e.action;
                });
            })

            const click = () => {
                events.dispatch(self.el, 'test', { action: 'cool' });
            }

            return render => render`
                <button onclick="${click}" />
            `;
        }

        // Render the component and assert the return
        return render(Component).assert('cool', function () {
            const self = this;
            self.el.click();
            return self.el.title;
        });
    });
});