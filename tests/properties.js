tester('Tracking sub-level object properties', function(render) {
    // Lemonade Component
    function Component () {
        let self = this;
        self.test = {
            value: 123,
        }
        // Title and year are declared in the parent template
        let template = `<div>
            <h1 :ref="self.title">{{self.test.value}}</h1>
            <input type="button" onclick="self.test.value++" :ref="self.button" />
          </div>`;

        return lemonade.element(template, self);
    }

    // Render the component and assert the return
    return render(Component).assert('124', function() {
        let self = this;
        // Simulate the click in the button
        self.button.click();
        // Return the value
        return self.title.textContent;
    })
});

tester('Reactive properties in class or method components', function(render) {
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