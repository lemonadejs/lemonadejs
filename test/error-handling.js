describe('Error handling', () => {

    it('Should handle invalid template syntax gracefully', function() {
        function Component() {
            let self = this;
            self.value = 'test';
            // Invalid template with unclosed braces
            return render => render`<div>{{self.value</div>`;
        }

        return render(Component).assert(true, function() {
            let self = this;
            // Should render something even with invalid template
            return self.el.innerHTML.length > 0;
        });
    });

    it('Should handle undefined references in templates', function() {
        function Component() {
            let self = this;
            // Reference undefined property
            return render => render`<div>{{self.nonexistent}}</div>`;
        }

        return render(Component).assert('', function() {
            let self = this;
            return self.el.textContent;
        });
    });

    it('Should handle null values in templates', function() {
        function Component() {
            let self = this;
            self.value = null;
            return render => render`<div>{{self.value}}</div>`;
        }

        return render(Component).assert('', function() {
            let self = this;
            return self.el.textContent;
        });
    });

    it('Should handle circular references safely', function() {
        function Component() {
            let self = this;
            self.circular = {};
            self.circular.ref = self.circular;
            
            return render => render`<div>test</div>`;
        }

        return render(Component).assert('test', function() {
            let self = this;
            return self.el.textContent;
        });
    });

    it('Should handle invalid component references', function() {
        function Component() {
            let self = this;
            // Reference non-existent component
            return render => render`<NonExistentComponent />`;
        }

        return render(Component).assert(true, function() {
            let self = this;
            // Should still render the element
            return self.el.tagName.toLowerCase() === 'nonexistentcomponent';
        });
    });

    it('Should handle malformed event handlers', function() {
        function Component() {
            let self = this;
            self.value = 'initial';
            
            // Invalid event handler syntax
            return render => render`<button onclick="invalid.syntax.here" :ref="self.button">Click</button>`;
        }

        return render(Component).assert('Click', function() {
            let self = this;
            return self.button.textContent;
        });
    });

    it('Should handle deeply nested property access', function() {
        function Component() {
            let self = this;
            self.data = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep'
                        }
                    }
                }
            };
            
            return render => render`<div>{{self.data.level1.level2.level3.value}}</div>`;
        }

        return render(Component).assert('deep', function() {
            let self = this;
            return self.el.textContent;
        });
    });

    it('Should handle array access in templates', function() {
        function Component() {
            let self = this;
            self.items = ['first', 'second', 'third'];
            
            return render => render`<div>{{self.items[1]}}</div>`;
        }

        return render(Component).assert('second', function() {
            let self = this;
            return self.el.textContent;
        });
    });

});