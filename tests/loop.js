tester('Update the first element inside a loop', function(render) {
    // Get the attributes from the tag
    function Component() {
        let self = this;

        self.data = [
            { title: 'lemonadejs' },
            { title: 'angular'}
        ];

        return `<>
            <ul @loop="self.data" @ref="self.root">
                <li>{{self.title}}</li>
            </ul>
        </ul>`;
    }

    // Render the component and assert the return
    return render(Component).assert('New title', function() {
        let self = this;
        self.data[0].title = 'New title';
        return self.root.children[0].textContent;
    })
});

tester('Add a new item in the loop and refresh', function(render) {
    // Get the attributes from the tag
    function Component() {
        let self = this;

        self.data = [
            { title: 'lemonadejs' },
            { title: 'angular'}
        ];

        return `<ul @loop="self.data" @ref="self.root">
            <li>{{self.title}}</li>
        </ul>`;
    }

    // Render the component and assert the return
    return render(Component).assert('123', function() {
        let self = this;
        self.data.push({ title: '123' });
        self.refresh('data')
        return self.root.lastChild.textContent;
    })
});