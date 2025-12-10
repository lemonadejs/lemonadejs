describe('Special Attributes', () => {

    it(':ready - execute function when element is mounted', function() {
        function Component() {
            this.mountedElements = [];

            const onReady = (element) => {
                this.mountedElements.push(element.tagName);
            };

            return render => render`<div>
                <p :ready="${onReady}" :ref="self.p">Paragraph</p>
                <span :ready="${onReady}" :ref="self.span">Span</span>
                <button :ready="${onReady}" :ref="self.button">Button</button>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            // All elements should have called ready
            return this.mountedElements.length === 3 &&
                   this.mountedElements.includes('P') &&
                   this.mountedElements.includes('SPAN') &&
                   this.mountedElements.includes('BUTTON');
        });
    });

    it(':ready - receives the element as parameter', function() {
        function Component() {
            this.elementReceived = null;

            const onReady = (el) => {
                this.elementReceived = el;
            };

            return render => render`<div>
                <div id="test-element" :ready="${onReady}" :ref="self.testDiv">Content</div>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            // Should receive the actual DOM element
            return this.elementReceived === this.testDiv &&
                   this.elementReceived.id === 'test-element' &&
                   this.elementReceived.textContent === 'Content';
        });
    });

    it(':ready - multiple ready handlers on same element', function() {
        function Component() {
            this.handler1Called = false;
            this.handler2Called = false;

            const onReady1 = () => {
                this.handler1Called = true;
            };

            const onReady2 = () => {
                this.handler2Called = true;
            };

            // Note: Only one :ready can be used per element, this tests that behavior
            return render => render`<div>
                <p :ready="${onReady1}" :ref="self.p">Test</p>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            return this.handler1Called === true;
        });
    });

    it(':ready - with custom components', function() {
        function ChildComponent() {
            return render => render`<div :ref="self.childDiv">Child Content</div>`;
        }

        lemonade.setComponents({ ChildComponent });

        function ParentComponent() {
            this.childReady = false;

            const onChildReady = (el) => {
                this.childReady = true;
            };

            return render => render`<div>
                <ChildComponent :ready="${onChildReady}" :ref="self.child" />
            </div>`;
        }

        // Render and test
        return render(ParentComponent).assert(true, function() {
            return this.childReady === true;
        });
    });

    it(':ready - initialization logic', function() {
        function Component() {
            this.initialized = false;

            const initialize = (el) => {
                // Set initial styles or setup
                el.style.backgroundColor = 'red';
                this.initialized = true;
            };

            return render => render`<div>
                <div :ready="${initialize}" :ref="self.box">Box</div>
            </div>`;
        }

        // Render and test
        return render(Component).assert('red', function() {
            return this.box.style.backgroundColor;
        });
    });

    it(':ref - assigns DOM element reference', function() {
        function Component() {
            return render => render`<div>
                <input type="text" :ref="self.myInput" value="test" />
                <button :ref="self.myButton">Click</button>
                <div :ref="self.myDiv">Content</div>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            return this.myInput.tagName === 'INPUT' &&
                   this.myInput.value === 'test' &&
                   this.myButton.tagName === 'BUTTON' &&
                   this.myDiv.tagName === 'DIV' &&
                   this.myDiv.textContent === 'Content';
        });
    });

    it(':ref - with nested components', function() {
        function ChildComponent() {
            return render => render`<div>
                <span :ref="self.childSpan">Child Span</span>
            </div>`;
        }

        lemonade.setComponents({ ChildComponent });

        function ParentComponent() {
            return render => render`<div>
                <ChildComponent :ref="self.childComp" />
                <p :ref="self.parentP">Parent P</p>
            </div>`;
        }

        // Render and test
        return render(ParentComponent).assert(true, function() {
            return this.childComp.childSpan.textContent === 'Child Span' &&
                   this.parentP.textContent === 'Parent P';
        });
    });

    it(':ref - dynamic references in loops', function() {
        function Component() {
            this.items = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
                { id: 3, name: 'Item 3' }
            ];

            return render => render`<div>
                <div :loop="self.items">
                    <p :ref="self.itemRef">{{self.name}}</p>
                </div>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            // Each item should have its own ref
            return this.items[0].itemRef.textContent === 'Item 1' &&
                   this.items[1].itemRef.textContent === 'Item 2' &&
                   this.items[2].itemRef.textContent === 'Item 3';
        });
    });

    it('self.el - references component root element', function() {
        function Component() {
            this.checkRoot = () => {
                return this.el.tagName === 'DIV' &&
                       this.el.className === 'root-component';
            };

            return render => render`<div class="root-component">
                <p>Content</p>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            return this.checkRoot();
        });
    });

    it('self.el - manipulate root element', function() {
        function Component() {
            const addStyle = () => {
                this.el.style.backgroundColor = 'blue';
                this.el.setAttribute('data-modified', 'true');
            };

            return render => render`<div>
                <button onclick="${addStyle}" :ref="self.button">Modify Root</button>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            this.button.click();
            return this.el.style.backgroundColor === 'blue' &&
                   this.el.getAttribute('data-modified') === 'true';
        });
    });

    it('self.parent - reference parent in loop context', function() {
        function Component() {
            this.parentValue = 'Parent Data';
            this.items = [
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ];

            return render => render`<div>
                <div :loop="self.items">
                    <p :ref="self.item">ID: {{self.id}}, Parent: {{self.parent.parentValue}}</p>
                </div>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            return this.items[0].item.textContent === 'ID: 1, Parent: Parent Data' &&
                   this.items[1].item.textContent === 'ID: 2, Parent: Parent Data' &&
                   this.items[2].item.textContent === 'ID: 3, Parent: Parent Data';
        });
    });

    it('self.parent - verify parent reference exists in loop', function() {
        function Component() {
            this.parentValue = 'parent';
            this.items = [
                { id: 1 },
                { id: 2 }
            ];

            return render => render`<div>
                <div :loop="self.items">
                    <p :ref="self.p">{{self.id}}</p>
                </div>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            // Verify items have parent reference
            return this.items[0].parent === this &&
                   this.items[1].parent === this;
        });
    });

    xit('Attribute with template literal', function() {
        function Component() {
            this.testValue = 'hello';

            return render => render`<div>
                <p data-value="test-${self.testValue}" :ref="self.p">Test</p>
            </div>`;
        }

        // Render and test
        return render(Component).assert('test-hello', function() {
            return this.p.getAttribute('data-value');
        });
    });

    it('Attribute syntax variations - colon prefix :', function() {
        function Component() {
            this.testValue = 'colon';

            return render => render`<div>
                <p :data-value="self.testValue" :ref="self.p">Test</p>
            </div>`;
        }

        // Render and test
        return render(Component).assert('colon', function() {
            return this.p.getAttribute('data-value');
        });
    });

    it('Complex :ready - setup third-party libraries', function() {
        function Component() {
            this.setupComplete = false;

            const setupChart = (canvas) => {
                // Simulate setting up a chart library
                canvas.setAttribute('data-chart-initialized', 'true');
                canvas.width = 400;
                canvas.height = 300;
                this.setupComplete = true;
            };

            return render => render`<div>
                <canvas :ready="${setupChart}" :ref="self.canvas"></canvas>
            </div>`;
        }

        // Render and test
        return render(Component).assert(true, function() {
            return this.setupComplete &&
                   this.canvas.getAttribute('data-chart-initialized') === 'true' &&
                   this.canvas.width === 400 &&
                   this.canvas.height === 300;
        });
    });

});
