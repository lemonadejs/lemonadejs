const jsdom = require('global-jsdom/register')
const tester = require('../dist/lemonade.tester')
const lemonade = require('../dist/lemonade');

tester('Tracking sub-level object properties', function(render) {
    // Lemonade Component
    function Component () {
        let self = this;
        self.test = {
            value: 123,
        }
        // Title and year are declared in the parent template
        let template = `<div class="p10">
            <h1 :ref="self.title">{{self.test.value}}</h1>
            <input type="button" onclick="self.test.value++" :ref="self.button" />
          </div>`;

        return lemonade.element(template, self);
    }

    // Render the component and assert the return
    return render(Component).assert(124, function() {
        let self = this;
        // Simulate the click in the button
        self.button.click();
        // Return the value
        return self.test.value;
    })
});

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
    return render(Component).assert('1000', function() {
        let self = this;

        return self.component?.value;
    })
});

tester('Two-way binding for custom elements with @bind', function(render) {
    function Test() {
        let self = this;
        let template = `<div>
            <input type="button" onclick="self.value++" @ref="self.button" />
        </div>`;

        return lemonade.element(template, self);
    }

    // Get the attributes from the tag
    function Component() {
        let self = this;
        self.test = 120;
        let template = `<div class="p10">
            <h1 @ref="self.title">{{self.test}}</h1>
            <Test @bind="self.test" @ref="self.component" />
        </div>`;

        return lemonade.element(template, self, { Test });
    }

    // Render the component and assert the return
    return render(Component).assert(121, function() {
        let self = this;
        // Trigger click in the child element
        self.component.button.click();
        // Check for the title updates
        return parseInt(self.title.textContent);
    })
});

tester('Custom element as a root element', function(render) {
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
    lemonade.setComponents({ Test });

    // Render the component and assert the return
    return render(Component).assert('BODY', function() {
        let self = this;

        return self.component?.el.parentNode?.parentNode?.tagName;
    })
});

tester('Custom element renders in the correct position', function(render) {
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
    lemonade.setComponents({ Test });

    // Render the component and assert the return
    return render(Component).assert(true, function() {
        let self = this;

        // What is the position of the element inside its parent
        return self.test.parentNode.children[2] === self.test;
    })
});

// Tests related to @loop

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

// Run all tests. Change that later TODO:
tester.run();