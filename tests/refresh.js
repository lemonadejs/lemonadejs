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
    return render(Component).assert('2', function() {
        let self = this;
        self.reference.refresh();
        return self.reference.el.parentNode.children[3].textContent;
    })
});

tester('Testing node tagName a single item inside a loop refresh', function(render) {
    function Test() {
        var self = this;
        if (self.status) {
            return `<h1 onclick="self.status = 0; self.refresh()">{{self.title}}</h1>`;
        } else {
            return `<h2 onclick="self.status = 0; self.refresh()">{{self.title}}</h2>`;
        }
    }

    function Component() {
        var self = this;
        self.rows = [
            { title:'Google', description: 'The alpha search engine...', status: 1 },
            { title:'Bind', description: 'The microsoft search engine...', status: 1 },
            { title:'Duckduckgo', description: 'Privacy in the first place...', status: 1 },
        ];

        return `<><Test @loop="self.rows" /></>`;
    }


    // Register as a global component.
    lemonade.setComponents({ Test });

    // Render the component and assert the return
    return render(Component).assert('H2', function() {
        let self = this;
        self.rows[1].status = 0;
        self.rows[1].refresh();
        return self.rows[1].el.parentNode.children[1].tagName;
    })
});

