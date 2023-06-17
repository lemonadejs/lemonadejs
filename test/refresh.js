describe('Refresh', () => {

    it('Testing node position after full refresh', function() {
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

            return lemonade.element(template, self, {Test});
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert('2', function () {
            let self = this;
            self.reference.refresh();
            return self.reference.el.parentNode.children[3].textContent;
        })
    });

    it('Testing node tagName a single item inside a loop refresh', function() {
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
                {title: 'Google', description: 'The alpha search engine...', status: 1},
                {title: 'Bing', description: 'The microsoft search engine...', status: 1},
                {title: 'Duckduckgo', description: 'Privacy in the first place...', status: 1},
            ];

            return `<><Test @loop="self.rows" /></>`;
        }


        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert('H2', function () {
            let self = this;
            self.rows[1].status = 0;
            self.rows[1].refresh();
            return self.rows[1].el.parentNode.children[1].tagName;
        })
    });

    it('Update the property of a self when using reference', function() {

        function Test() {
            var self = this;

            return `<div>{{self.data}}</div>`;
        }

        function Component() {
            let self = this;

            self.number = 1;

            return `<><Test :data="self.number*10" :ref="self.instance" /></>`;
        }


        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert('10', function () {
            let self = this;

            return self.instance.el.textContent;
        })
    });
});