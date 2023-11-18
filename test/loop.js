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
            <ul @loop="self.data" @ref="self.root">
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

            return `<ul @loop="self.data" @ref="self.root">
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
        let Mylist = function () {
            // Create one self for each interaction in the array
            const self = this;
            // Template
            return `<li><b>{{self.title}}</b><br><i>{{self.description}}</i></li>`;
        }

        let Component = function () {
            const self = this;

            self.rows = [
                {title: 'Google', description: 'The alpha search engine...'},
                {title: 'Bing', description: 'The microsoft search engine...'},
                {title: 'Yahoo', description: 'The old stuff...'},
            ];

            // Custom components such as List should always be unique inside a real tag.
            let template = `<ul><Mylist @loop="self.rows" /></ul>`;

            // Passing as a local component. It means, won't be available globally
            return lemonade.element(template, self, {Mylist});
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









});