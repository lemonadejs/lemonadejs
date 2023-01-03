tester('Testing node position after full refresh', function(render) {
    function Test() {
        let self = this;
        let template = `<div>{{self.value}}</div>`;

        return lemonade.element(template, self);
    }

    // Get the attributes from the tag
    function Component() {
        let self = this;
        let template = `<>
            <p></p>
            <Test value="1"/>
            <p></p>
            <Test value="2" @ref="self.reference"/>
            <p></p>
            <Test value="3"/>
        </>`;

        return lemonade.element(template, self, { Test });
    }

    // Register as a global component.
    lemonade.setComponents({ Test });

    // Render the component and assert the return
    return render(Component).assert(2, function() {
        let self = this;
        self.reference.refresh();
        return self.reference.parentNode.children[3].textContent;
    })
});

