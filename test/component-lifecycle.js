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

    it('onunload event should be called when component is destroyed', function() {
        let unloadCalled = false;
        
        function Component() {
            let self = this;
            self.onunload = function() {
                unloadCalled = true;
            };
            return `<div>Component</div>`;
        }

        return render(Component).assert(true, function() {
            let self = this;
            // Simulate component destruction
            if (self.onunload) {
                self.onunload();
            }
            return unloadCalled;
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


});