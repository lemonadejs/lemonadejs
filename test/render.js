describe('Render', () => {

    it('Custom element as a root element', function() {
        function Test() {
            // Get the attributes from the tag
            let self = this;
            return `<h1>{{self.value}}</h1>`;
        }

        function Component() {
            let self = this;
            self.test = 120;
            return `<Test value="{{self.test}}" @ref="self.component" />`;
        }

        // Register components
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert('BODY', function () {
            let self = this;

            return self.component?.el.parentNode?.parentNode?.tagName;
        })
    });

    it('Custom element renders in the correct position', function() {
        function Test() {
            // Get the attributes from the tag
            let self = this;
            // Title and year are declared in the parent template
            return `<div>{{self.value}}</div>`;
        }

        // Get the attributes from the tag
        function Component() {
            let self = this;
            return `<>
            <div>break 1</div>
            <Test value="1" />
            <div @ref="self.test">break 2</div>
            <Test value="2" />
        </>`;
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;

            // What is the position of the element inside its parent
            return self.test.parentNode.children[2] === self.test;
        })
    });
});