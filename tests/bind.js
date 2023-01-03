tester('@Bind on custom components as classes', function(render) {
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
        return`<div>
            <h1 @ref="self.title">{{self.test}}</h1>
            <Hello @bind="self.test" @ref="self.component" />
            <input type="button" onclick="self.test++" @ref="self.button"  />
        </div>`;
    }


    // Register as a global component.
    lemonade.setComponents({ Hello });

    // Render the component and assert the return
    return render(Component).assert(true, function() {
        let self = this;
        return self.component.el.textContent === self.title.textContent;
    })
});

tester('@Bind on custom components as classes', function(render) {
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
    lemonade.setComponents({ FunctionComponent, ClassComponent });

    // Render the component and assert the return
    return render(MainView).assert(true, function() {
        let self = this;
        self.value++;
        return self.function.el.textContent === self.class.el.textContent;
    })
});

tester('Testing @loop and @bind together.', function(render) {
    const Component = function() {
        let self = Object.assign(this, {
            value: 2,
            options: [
                { id: 1, name: "tex" },
                { id: 2, name: "mex" },
                { id: 3, name: "Crop" },
                { id: 4, name: "Trucs" },
                { id: 5, name: "Food" }
            ]
        })

        return `<select :loop='self.options' :bind='self.value' :ref="self.select">
              <option value='{{self.id}}'>{{self.name}}</option>
            </select>`;
    }

    // Render the component and assert the return
    return render(Component).assert(1, function() {
        let self = this;
        return self.select.selectedIndex;
    })
});