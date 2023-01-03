tester('Reference for a custom component as a class', function(render) {
    class Hello extends lemonade.component {
        constructor(o) {
            super(o);
        }

        render() {
            return `<div>
                <h1>{{self.value}}</h1>
            </div>`;
        }
    }

    // Get the attributes from the tag
    function Component() {
        let self = this;
        self.value = 1000;

        // Title and year are declared in the parent template
        let template = `<div>
            <Hello value="{{self.value}}" @ref="self.component"/>
          </div>`;

        return lemonade.element(template, self, { Hello });
    }

    // Render the component and assert the return
    return render(Component).assert(1000, function() {
        let self = this;

        return self.component?.value;
    })
});

// Test related to pass variables as references
tester('Passing variables and functions as references', function(render) {
    function test() {
        console.log(arguments)
    }

    function Component() {
        let self = this;
        self.value = 123;

        return (template) => template`
            <div test="${test}">${1+1}</div>
        `;
    }

    // Render the component and assert the return
    return render(Component).assert(true, function() {
        let self = this;
        return this.el.test === test;
    })
});


