describe('Loop', () => {

    it('Update the first element inside a loop', function() {
        // Get the attributes from the tag
        function Component() {
            let self = this;

            self.data = [
                {title: 'lemonadejs'},
                {title: 'angular'}
            ];

            return `<>
            <ul :loop="self.data" :ref="self.root">
                <li>{{self.title}}</li>
            </ul>
        </ul>`;
        }

        // Render the component and assert the return
        return render(Component).assert('New title', function () {
            let self = this;
            self.data[0].title = 'New title';
            return self.root.children[0].textContent;
        })
    });

    it('Add a new item in the loop and refresh', function() {
        // Get the attributes from the tag
        function Component() {
            let self = this;

            self.data = [
                {title: 'lemonadejs'},
                {title: 'angular'}
            ];

            return `<ul :loop="self.data" :ref="self.root">
            <li>{{self.title}}</li>
        </ul>`;
        }

        // Render the component and assert the return
        return render(Component).assert('123', function () {
            let self = this;
            self.data.push({title: '123'});
            self.refresh('data')
            return self.root.lastChild.textContent;
        })
    });

    it('Add a new item in the loop and refresh', function() {
        let Test = function () {
            // Create one self for each interaction in the array
            const self = this;
            // Template
            return `<li><b>{{self.title}}</b><br><i>{{self.description}}</i></li>`;
        }

        lemonade.setComponents({Test})

        let Component = function () {
            const self = this;

            self.rows = [
                {title: 'Google', description: 'The alpha search engine...'},
                {title: 'Bing', description: 'The microsoft search engine...'},
                {title: 'Yahoo', description: 'The old stuff...'},
            ];

            // Custom components such as List should always be unique inside a real tag.
            return `<ul><Test :loop="self.rows" /></ul>`;
        }

        // Render the component and assert the return
        return render(Component).assert(3, function () {
            let self = this;
            return self.el.children.length;
        })
    });

    it('Loop with numerical arrays', function() {
        let Component = function() {
            let self = this;
            self.data = [0,1,2];
            return `<div :loop="self.data"><span>{{self}}</span></div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('0', function () {
            let self = this;
            return self.el.children[0].textContent;
        })
    });

    it('Loop including custom element', function() {
        function Test() {
            // Create oneself for each interaction in the array
            const self = this;
            // Template
            return `<li>{{self.title}}</li>`;
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        function Component() {
            const self = this;

            self.rows = [
                {title: 'Google', description: 'The alpha search engine...'},
            ];

            // Custom components such as List should always be unique inside a real tag.
            return render => render`<ul :loop="self.rows"><Test :title="self.title" /></ul>`;
        }


        // Render the component and assert the return
        return render(Component).assert('Google', function () {
            let self = this;
            return self.el.textContent;
        })
    });

    it('Loop including a custom element by reference', function() {
        function Test() {
            // Create oneself for each interaction in the array
            const self = this;
            // Template
            return `<li>{{self.title}}</li>`;
        }

        function Component() {
            const self = this;

            self.rows = [
                {title: 'Google', description: 'The alpha search engine...'},
            ];

            // Custom components such as List should always be unique inside a real tag.
            return render => render`<ul :loop="self.rows"><${Test} :title="self.title" /></ul>`;
        }


        // Render the component and assert the return
        return render(Component).assert('Google', function () {
            let self = this;
            return self.el.textContent;
        })
    });

    it('Loop including a local scope variable', function() {
        function Component() {
            const rows = [
                { title: 'Google' },
                { title: 'Bing' },
            ];

            // Custom components such as List should always be unique inside a real tag.
            return render => render`<ul :loop="${rows}"><li>{{self.title}}</li></ul>`;
        }

        // Render the component and assert the return
        return render(Component).assert('Google', function () {
            let self = this;
            return self.el.firstChild.textContent;
        })
    });

    it('Loop with tables', function() {
        function Component() {
            const self = this;

            self.rows = [
                { title:'Google', description: 'The alpha search engine...' },
                { title:'Bing', description: 'The microsoft search engine...' },
                { title:'Duckduckgo', description: 'Privacy in the first place...' },
            ];

            // Custom components such as List should always be unique inside a real tag.
            return render => render`<table>
                <tbody :loop="${self.rows}">
                    <tr><td>{{this.title}}</td></tr>
                </tbody>
            </table>`;
        }


        // Render the component and assert the return
        return render(Component).assert('Google', function () {
            let self = this;
            return self.el.firstChild.firstChild.textContent;
        })
    });


    it('Loop with bind', function() {
        function Component() {

            this.language = 'pt_BR';

            this.data = [
                { title: 'English', value: 'en_GB' },
                { title: 'Portuguese', value: 'pt_BR' },
            ]


            return render => render `
                <select :loop="this.data" :bind="this.language">
                    <option value="{{self.value}}">{{self.title}}</option>
                </select>`
        }

        // Render the component and assert the return
        return render(Component).assert('pt_BR', function () {
            let self = this;
            return self.el.value;
        })
    });

});