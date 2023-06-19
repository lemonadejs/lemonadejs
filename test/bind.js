describe('Bind', () => {

    it('Initial value in the custom component @bind property', function() {
        function Test() {
            // This will bring all properties defined in the tag
            let self = this;
            // Custom HTML components has the self.value as default
            return `<b>{{self.value}}</b>`;
        }

        function Component() {
            let self = this;
            self.test = "Hello world";

            return `<Test @bind="self.test" @ref="self.component"/>`;
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert('Hello world', function () {
            let self = this;
            return self.component.el.textContent;
        })
    });

    it('@Bind on custom components as classes', function() {
        class Hello extends lemonade.component {
            constructor(s) {
                super(s);
            }

            render() {
                return `<div>{{self.value}}</div>`;
            }
        }

        // Get the attributes from the tag
        function Component() {
            let self = this;
            self.test = 120;
            return `<div>
            <h1 @ref="self.title">{{self.test}}</h1>
            <Hello @bind="self.test" @ref="self.component" />
            <input type="button" onclick="self.test++" @ref="self.button"  />
        </div>`;
        }


        // Register as a global component.
        lemonade.setComponents({Hello});

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;
            return self.component.el.textContent === self.title.textContent;
        })
    });

    it('Testing @loop and @bind together.', function() {
        const Component = function () {
            let self = Object.assign(this, {
                value: 2,
                options: [
                    {id: 1, name: "tex"},
                    {id: 2, name: "mex"},
                    {id: 3, name: "Crop"},
                    {id: 4, name: "Trucs"},
                    {id: 5, name: "Food"}
                ]
            })

            return `<select :loop='self.options' :bind='self.value' :ref="self.select">
              <option value='{{self.id}}'>{{self.name}}</option>
            </select>`;
        }

        // Render the component and assert the return
        return render(Component).assert(1, function () {
            let self = this;
            return self.select.selectedIndex;
        })
    });

    it('Two-way data binding for custom elements with @bind', function() {
        function Test() {
            let self = this;
            let template = `<div>
            <input type="button" onclick="self.value++" @ref="self.button" />
        </div>`;

            return lemonade.element(template, self);
        }

        // Get the attributes from the tag
        function Component() {
            let self = this;
            self.test = 120;
            let template = `<div class="p10">
            <h1 @ref="self.title">{{self.test}}</h1>
            <Test @bind="self.test" @ref="self.component" />
        </div>`;

            return lemonade.element(template, self, {Test});
        }

        // Render the component and assert the return
        return render(Component).assert(121, function () {
            let self = this;
            // Trigger click in the child element
            self.component.button.click();
            // Check for the title updates
            return parseInt(self.title.textContent);
        })
    });

    it('Two-way data binding on custom elements (protection against loop)', function() {
        function Test() {
            // This will bring all properties defined in the tag
            let self = this;
            // Custom HTML components has the self.value as default
            return `<b onclick="self.value++">{{self.value}}</b>`;
        }

        function Component() {
            let self = this;
            self.test = 1;
            return `<Test @bind="self.test" @ref="self.component"/>`;
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;
            // Trigger update
            self.test++;
            // Check for the title updates
            return self.component.value === self.test;
        })
    });

});
