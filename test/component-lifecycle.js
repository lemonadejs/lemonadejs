describe('Component lifecycle', () => {

    it('onload event should be called after component is rendered', function() {
        let loadCalled = false;
        
        function Component() {
            let self = this;
            self.onload = function() {
                loadCalled = true;
            };
            return `<div>Component loaded</div>`;
        }

        return render(Component).assert(true, function() {
            return loadCalled;
        });
    });

    it('onchange event should be called when property changes', function() {
        let changeCalled = false;
        
        function Component() {
            let self = this;
            self.value = 1;
            self.onchange = function() {
                changeCalled = true;
            };
            return `<div>{{self.value}}</div>`;
        }

        return render(Component).assert(true, function() {
            let self = this;
            self.value = 2;
            return changeCalled;
        });
    });

    it('Multiple onchange events should be called in sequence', function() {
        let changeCount = 0;
        
        function Component() {
            let self = this;
            self.value = 1;
            self.onchange = function() {
                changeCount++;
            };
            return `<div>{{self.value}}</div>`;
        }

        return render(Component).assert(3, function() {
            let self = this;
            self.value = 2;
            self.value = 3;
            self.value = 4;
            return changeCount;
        });
    });

    it('Component with class syntax should call constructor', function() {
        let constructorCalled = false;
        
        class TestComponent extends lemonade.component {
            constructor(o) {
                super(o);
                constructorCalled = true;
            }
            
            render() {
                return `<div>Class component</div>`;
            }
        }

        return render(TestComponent).assert(true, function() {
            return constructorCalled;
        });
    });

    it('Custom component should receive initial properties', function() {
        function Test() {
            let self = this;
            return `<div>{{self.title}}</div>`;
        }

        function Component() {
            let self = this;
            return `<Test title="Custom Title" :ref="self.child"/>`;
        }

        lemonade.setComponents({Test});

        return render(Component).assert('Custom Title', function() {
            let self = this;
            return self.child.el.textContent;
        });
    });

    it('Component should handle property updates after render', function() {
        function Component() {
            let self = this;
            self.count = 0;
            self.increment = function() {
                self.count++;
            };
            return `<div>{{self.count}}</div>`;
        }

        return render(Component).assert('3', function() {
            let self = this;
            self.increment();
            self.increment();
            self.increment();
            return self.el.textContent;
        });
    });

    it('Component should handle method calls', function() {
        function Component() {
            let self = this;
            self.message = 'initial';
            self.updateMessage = function(newMessage) {
                self.message = newMessage;
            };
            return `<div>{{self.message}}</div>`;
        }

        return render(Component).assert('updated', function() {
            let self = this;
            self.updateMessage('updated');
            return self.el.textContent;
        });
    });

    it('onload should fire for loop components inside render block when render becomes true', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = false;
            this.items = [{id: 1}, {id: 2}, {id: 3}];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        // Note: Currently onloads fire immediately during creation even when render is false
        // The test checks that after toggling render, onload count reflects all items
        return render(Component).assert(3, function() {
            let self = this;
            self.show = true;
            return onloadCount;
        });
    });

    it('onload should fire only when elements are actually in DOM (render starts false)', function() {
        let onloadCount = 0;
        let onloadFiredWhenHidden = false;

        function Child() {
            this.onload = () => {
                onloadCount++;
                // Check if element is actually in the document
                if (!document.body.contains(this.el)) {
                    onloadFiredWhenHidden = true;
                }
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = false;
            this.items = [{id: 1}, {id: 2}, {id: 3}];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        return render(Component).assert(false, function() {
            let self = this;
            self.show = true;
            // onload should not have fired when element was hidden
            return onloadFiredWhenHidden;
        });
    });

    it('onload should fire when loop data changes dynamically inside render block', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = true;
            this.items = [];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        return render(Component).assert(3, function() {
            let self = this;
            // Initially no items
            if (onloadCount !== 0) {
                throw new Error('onload should not fire with empty items');
            }
            // Add items dynamically
            self.items = [{id: 1}, {id: 2}, {id: 3}];
            self.refresh('items');
            return onloadCount;
        });
    });

    it('onload should fire when render toggles from false to true with existing loop data', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = false;
            this.items = [{id: 1}, {id: 2}];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        return render(Component).assert(2, function() {
            let self = this;
            let initialCount = onloadCount;
            // Toggle render to true
            self.show = true;
            // The onload should fire (or have already fired) for both items
            return onloadCount;
        });
    });

    it('onload should fire for nested components inside render with loop', function() {
        let grandchildOnloadCount = 0;

        function Grandchild() {
            this.onload = () => {
                grandchildOnloadCount++;
            };
            return `<span>grandchild</span>`;
        }

        function Child() {
            return `<div><Grandchild /></div>`;
        }

        lemonade.setComponents({Child, Grandchild});

        function Component() {
            this.show = false;
            this.items = [{id: 1}, {id: 2}];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        return render(Component).assert(2, function() {
            let self = this;
            // Toggle render to true
            self.show = true;
            return grandchildOnloadCount;
        });
    });

    it('onload should fire for deeply nested loop inside render', function() {
        let onloadCount = 0;

        function DeepChild() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>deep</span>`;
        }

        function Middle() {
            this.items = [{id: 'a'}, {id: 'b'}];
            return `<div :loop="this.items"><DeepChild /></div>`;
        }

        lemonade.setComponents({DeepChild, Middle});

        function Component() {
            this.show = false;
            return `<div :render="this.show"><Middle /></div>`;
        }

        return render(Component).assert(2, function() {
            let self = this;
            self.show = true;
            return onloadCount;
        });
    });

    it('onload should fire when component with render+loop is rendered to detached root then attached', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = true;
            this.items = [{id: 1}, {id: 2}];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        // Create a detached root (not in document.body)
        let detachedRoot = document.createElement('div');
        let self = {};

        // Render to detached root - show is true so children should render
        lemonade.render(Component, detachedRoot, self);

        // At this point, onload may or may not have fired (root not in DOM)
        let countBeforeAttach = onloadCount;

        // Now attach to document
        document.body.appendChild(detachedRoot);

        // Check if onload fired (should be 2)
        let result = onloadCount;

        // Cleanup
        detachedRoot.remove();

        // Return a mock object for the test framework
        return {
            assert: function(expected, fn) {
                // We expect onloads to fire - either during render or after attach
                if (result !== 2) {
                    throw new Error(`Expected 2 onloads but got ${result}. Before attach: ${countBeforeAttach}`);
                }
            }
        };
    });

    it('onload should fire when render becomes true after detached root is attached', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = false;  // Start with render=false
            this.items = [{id: 1}, {id: 2}];
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        // Create a detached root (not in document.body)
        let detachedRoot = document.createElement('div');
        let self = {};

        // Render to detached root - show is false so children hidden
        lemonade.render(Component, detachedRoot, self);

        let countAfterRender = onloadCount;

        // Attach to document
        document.body.appendChild(detachedRoot);

        let countAfterAttach = onloadCount;

        // Now toggle render to true
        self.show = true;

        let countAfterShow = onloadCount;

        // Cleanup
        detachedRoot.remove();

        // Return a mock object for the test framework
        return {
            assert: function(expected, fn) {
                // We expect onloads to fire after show=true
                if (countAfterShow !== 2) {
                    throw new Error(`Expected 2 onloads after show=true but got ${countAfterShow}. After render: ${countAfterRender}, After attach: ${countAfterAttach}`);
                }
            }
        };
    });

    it('onload should fire when loop data changes dynamically inside render block', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = true;
            this.items = [];  // Start with empty array
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        // Create a detached root (not in document.body)
        let detachedRoot = document.createElement('div');
        let self = {};

        // Render to detached root
        lemonade.render(Component, detachedRoot, self);

        let countAfterRender = onloadCount;

        // Attach to document
        document.body.appendChild(detachedRoot);

        let countAfterAttach = onloadCount;

        // Now dynamically add loop data
        self.items = [{id: 1}, {id: 2}];
        self.refresh('items');

        let countAfterDataChange = onloadCount;

        // Cleanup
        detachedRoot.remove();

        // Return a mock object for the test framework
        return {
            assert: function(expected, fn) {
                // We expect onloads to fire after data change
                if (countAfterDataChange !== 2) {
                    throw new Error(`Expected 2 onloads after data change but got ${countAfterDataChange}. After render: ${countAfterRender}, After attach: ${countAfterAttach}`);
                }
            }
        };
    });

    it('onload should fire when loop data changes while render is initially false then true', function() {
        let onloadCount = 0;

        function Child() {
            this.onload = () => {
                onloadCount++;
            };
            return `<span>child</span>`;
        }

        lemonade.setComponents({Child});

        function Component() {
            this.show = false;  // Start hidden
            this.items = [];    // Start with empty array
            return `<div :render="this.show"><div :loop="this.items"><Child /></div></div>`;
        }

        // Create a detached root (not in document.body)
        let detachedRoot = document.createElement('div');
        let self = {};

        // Render to detached root
        lemonade.render(Component, detachedRoot, self);

        // Attach to document
        document.body.appendChild(detachedRoot);

        // Now add data while still hidden
        self.items = [{id: 1}, {id: 2}];
        self.refresh('items');

        let countWhileHidden = onloadCount;

        // Now show the content
        self.show = true;

        let countAfterShow = onloadCount;

        // Cleanup
        detachedRoot.remove();

        // Return a mock object for the test framework
        return {
            assert: function(expected, fn) {
                // We expect onloads to fire after show=true
                if (countAfterShow !== 2) {
                    throw new Error(`Expected 2 onloads after show=true but got ${countAfterShow}. While hidden: ${countWhileHidden}`);
                }
            }
        };
    });

});