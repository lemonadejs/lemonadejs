test('Initial value in the custom component @bind property', function(render) {
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
    lemonade.setComponents({ Test });

    // Render the component and assert the return
    return render(Component).assert('Hello world', function() {
        let self = this;
        return self.component.el.textContent;
    })
});
