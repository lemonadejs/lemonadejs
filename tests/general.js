test('Reference for a custom component as a class', function(render) {
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
    return render(Component).assert(1000, function() {
        let self = this;

        return self.component?.value;
    })
});

test('Passing variables and functions as references', function(render) {
    function test() {
        console.log(arguments)
    }

    function Component() {
        let self = this;
        self.value = 123;

        return (template) => template`
            <div test="${test}">${1+1}</div>
        `;
    }

    // Render the component and assert the return
    return render(Component).assert(true, function() {
        let self = this;
        return this.el.test === test;
    })
});


test('Integrating LemonadeJS with web-components', function(render) {
    class HelloElement extends HTMLElement {

        constructor() {
            super();
            this._value = this.value;
            delete this.value;
        }

        get value() {
            return this._value;
        }

        set value(v) {
            this._value = v;

            if (this._root) {
                this._root.textContent = v;
            }
        }

        connectedCallback() {
            this._root = document.createElement('div');
            this._root.textContent = this._value;
            this.appendChild(this._root);
        }

    }

    window.customElements.define(`hello-element`, HelloElement);

    // Get the attributes from the tag
    function Component() {
        let self = this;
        self.test = 120;
        return `<>
            <hello-element value="{{self.test}}" @ref="self.element"></hello-element>
        </>`;
    }

    // Render the component and assert the return
    return render(Component).assert('120', function() {
        let self = this;
        return self.element.firstChild.firstChild.textContent;
    })
});






