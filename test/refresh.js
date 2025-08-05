describe('Refresh', () => {

    it('Testing node position after full refresh', function() {
        function Test() {
            let self = this;
            return `<div>{{self.value}}</div>`;
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        // Get the attributes from the tag
        function Component() {
            let self = this;
            return `<>
                <p></p>
                <Test value="1"/>
                <p></p>
                <Test value="2" :ref="self.reference"/>
                <p></p>
                <Test value="3"/>
            </>`;
        }

        // Render the component and assert the return
        return render(Component).assert('2', function () {
            let self = this;
            self.reference.refresh();
            return self.reference.el.parentNode.children[3].textContent;
        })
    });

    it('Testing node tagName a single item inside a loop refresh', function() {
        function Test() {
            let self = this;

            if (self.status) {
                return `<h1>{{self.title}}</h1>`;
            } else {
                return `<h2>{{self.title}}</h2>`;
            }
        }

        function Component() {
            let self = this;
            self.rows = [
                {title: 'Google', description: 'The alpha search engine...', status: 1},
                {title: 'Bing', description: 'The microsoft search engine...', status: 1},
                {title: 'Duckduckgo', description: 'Privacy in the first place...', status: 1},
            ];

            return render => render`<><Test :loop="self.rows" /></>`;
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
});