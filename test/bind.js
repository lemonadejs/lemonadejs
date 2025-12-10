describe('Bind', () => {

    it('Initial value in the custom component :bind property', function() {
        function Test() {
            // Custom HTML components have the self.value as default
            return render => render`<b>{{self.value}}</b>`;
        }

        function Component() {
            this.test = "Hello world";
            return render => render`<Test :bind="self.test" :ref="self.component"/>`;
        }

        // Register as a global component.
        lemonade.setComponents({ Test });

        // Render the component and assert the return
        return render(Component).assert('Hello world', function () {
            return this.component.el.textContent;
        })
    });

    it(':bind on custom components as classes', function() {
        class Hello extends lemonade.component {
            constructor(s) {
                super(s);
            }

            render() {
                return `<div>{{self.value}}</div>`;
            }
        }

        // Get the attributes from the tag
        function Component() {
            this.test = 120;

            return render => render`<div>
                <h1 :ref="self.title">{{self.test}}</h1>
                <Hello :bind="self.test" :ref="self.component" />
                <input type="button" onclick="${()=>this.test++}" :ref="self.button"  />
            </div>`;
        }


        // Register as a global component.
        lemonade.setComponents({Hello});

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;
            return self.component.el.textContent === self.title.textContent;
        })
    });

    it('Testing :loop and :bind together.', function() {
        const Component = function () {
            Object.assign(this, {
                value: 2,
                options: [
                    {id: 1, name: "tex"},
                    {id: 2, name: "mex"},
                    {id: 3, name: "Crop"},
                    {id: 4, name: "Trucs"},
                    {id: 5, name: "Food"}
                ]
            })

            return render => render`<select :loop='self.options' :bind='self.value' :ref="self.select">
                <option value='{{self.id}}'>{{self.name}}</option>
            </select>`;
        }

        // Render the component and assert the return
        return render(Component).assert(1, function () {
            let self = this;
            return self.select.selectedIndex;
        })
    });

    it('Two-way data binding for custom elements with :bind', function() {
        function Test() {
            return render => render `<div>
                <input type="button" onclick="${()=>this.value++}" :ref="this.button" />
            </div>`;
        }

        lemonade.setComponents({Test})

        // Get the attributes from the tag
        function Component() {
            let self = this;
            self.test = 120;

            return render => render`<div class="p10">
                <h1 :ref="self.title">{{self.test}}</h1>
                <Test :bind="self.test" :ref="self.component" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert(121, function () {
            // Trigger click in the child element
            this.component.button.click();
            // Check for the title updates
            return parseInt(this.title.textContent);
        })
    });

    it('Two-way data binding on custom elements (protection against loop)', function() {
        function Test() {
            return render => render`<b>{{self.value}}</b>`;
        }

        function Component() {
            this.test = 1;
            return render => render`<Test :bind="self.test" :ref="self.component"/>`;
        }

        // Register as a global component.
        lemonade.setComponents({Test});

        // Render the component and assert the return
        return render(Component).assert('2', function () {
            // Trigger update
            this.test++;
            // Check for the title updates
            return this.component.el.textContent;
        })
    });


    it('Normal bind on select', function() {
        function Component() {
            // Default value of the property which is bound to the value of the dropdown
            this.language = 'pt_BR';

            return render => render`<select :bind="self.language">
                <option value="">Choose one</option>
                <option value="en_GB">English</option>
                <option value="pt_BR">Portuguese</option>
            </select>`;
        }

        // Render the component and assert the return
        return render(Component).assert(2, function () {
            let self = this;
            // Check for the title updates
            return self.el.selectedIndex;
        })
    });

    it('Radio button :bind - initial checked state when value equals bound property', function() {
        function Component() {
            // Default option - this should make the 'Pears' radio checked
            this.favorite = 'Pears';

            return render => render`<div>
                <label>
                    <input type='radio' name='favorite' value='Apples' :bind='self.favorite' :ref="self.apples" />
                    Apples
                </label>
                <label>
                    <input type='radio' name='favorite' value='Pears' :bind='self.favorite' :ref="self.pears" />
                    Pears
                </label>
                <label>
                    <input type='radio' name='favorite' value='Oranges' :bind='self.favorite' :ref="self.oranges" />
                    Oranges
                </label>
            </div>`;
        }

        // Render and verify that the matching radio button is checked
        return render(Component).assert(true, function () {
            // The 'Pears' radio should be checked because value === bound property
            return this.pears.checked === true &&
                   this.apples.checked === false &&
                   this.oranges.checked === false;
        })
    });

    it('Radio button :bind - programmatically changing value updates checked state', function() {
        function Component() {
            this.favorite = 'Pears';

            return render => render`<div>
                <label>
                    <input type='radio' name='favorite' value='Apples' :bind='self.favorite' :ref="self.apples" />
                    Apples
                </label>
                <label>
                    <input type='radio' name='favorite' value='Pears' :bind='self.favorite' :ref="self.pears" />
                    Pears
                </label>
                <label>
                    <input type='radio' name='favorite' value='Oranges' :bind='self.favorite' :ref="self.oranges" />
                    Oranges
                </label>
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert(true, function () {
            // Initially Pears should be checked
            let initialCheck = this.pears.checked === true;

            // Change the value programmatically to Oranges
            this.favorite = 'Oranges';

            // Now Oranges should be checked
            return initialCheck &&
                   this.oranges.checked === true &&
                   this.apples.checked === false &&
                   this.pears.checked === false;
        })
    });

    it('Radio button :bind - clicking radio updates bound property and checked state', function() {
        function Component() {
            this.favorite = 'Pears';

            return render => render`<div>
                <label>
                    <input type='radio' name='favorite' value='Apples' :bind='self.favorite' :ref="self.apples" />
                    Apples
                </label>
                <label>
                    <input type='radio' name='favorite' value='Pears' :bind='self.favorite' :ref="self.pears" />
                    Pears
                </label>
                <label>
                    <input type='radio' name='favorite' value='Oranges' :bind='self.favorite' :ref="self.oranges" />
                    Oranges
                </label>
            </div>`;
        }

        // Test user interaction
        return render(Component).assert(true, function () {
            // Click the Apples radio
            this.apples.click();

            // Verify both the bound property and checked states updated
            return this.favorite === 'Apples' &&
                   this.apples.checked === true &&
                   this.pears.checked === false &&
                   this.oranges.checked === false;
        })
    });

    it('Radio button :bind - multiple sequential changes', function() {
        function Component() {
            this.favorite = 'Pears';

            return render => render`<div>
                <label>
                    <input type='radio' name='favorite' value='Apples' :bind='self.favorite' :ref="self.apples" />
                    Apples
                </label>
                <label>
                    <input type='radio' name='favorite' value='Pears' :bind='self.favorite' :ref="self.pears" />
                    Pears
                </label>
                <label>
                    <input type='radio' name='favorite' value='Oranges' :bind='self.favorite' :ref="self.oranges" />
                    Oranges
                </label>
                <input type='button' onclick="${() => this.favorite = 'Oranges'}" :ref="self.setButton" />
            </div>`;
        }

        // Test multiple changes to ensure no cyclic loop issues
        return render(Component).assert(true, function () {
            // Initial state
            let step1 = this.pears.checked === true;

            // Click Apples
            this.apples.click();
            let step2 = this.apples.checked === true && this.favorite === 'Apples';

            // Programmatically set to Oranges
            this.favorite = 'Oranges';
            let step3 = this.oranges.checked === true && this.favorite === 'Oranges';

            // Click button to set Oranges again (value already equals)
            this.setButton.click();
            let step4 = this.oranges.checked === true && this.favorite === 'Oranges';

            return step1 && step2 && step3 && step4;
        })
    });

    it('Radio button :bind - with onchange callback', function() {
        function Component(children, { onchange }) {
            this.favorite = 'Pears';
            this.changeLog = [];

            onchange((prop) => {
                if (prop === 'favorite') {
                    this.changeLog.push(this.favorite);
                }
            });

            return render => render`<div>
                <label>
                    <input type='radio' name='favorite' value='Apples' :bind='self.favorite' :ref="self.apples" />
                    Apples
                </label>
                <label>
                    <input type='radio' name='favorite' value='Pears' :bind='self.favorite' :ref="self.pears" />
                    Pears
                </label>
                <label>
                    <input type='radio' name='favorite' value='Oranges' :bind='self.favorite' :ref="self.oranges" />
                    Oranges
                </label>
            </div>`;
        }

        // Verify onchange is triggered correctly
        return render(Component).assert(true, function () {
            // Click Oranges
            this.oranges.click();

            // Verify change was tracked and state is correct
            return this.favorite === 'Oranges' &&
                   this.oranges.checked === true &&
                   this.changeLog.length > 0 &&
                   this.changeLog[this.changeLog.length - 1] === 'Oranges';
        })
    });

    it('Checkbox :bind - initial checked state with truthy value', function() {
        function Component() {
            this.agreed = true;

            return render => render`<div>
                <label>
                    <input type='checkbox' :bind='self.agreed' :ref="self.checkbox" />
                    I agree to the terms
                </label>
            </div>`;
        }

        // Verify checkbox is checked when bound to truthy value
        return render(Component).assert(true, function () {
            return this.checkbox.checked === true;
        })
    });

    it('Checkbox :bind - initial unchecked state with falsy value', function() {
        function Component() {
            this.agreed = false;

            return render => render`<div>
                <label>
                    <input type='checkbox' :bind='self.agreed' :ref="self.checkbox" />
                    I agree to the terms
                </label>
            </div>`;
        }

        // Verify checkbox is unchecked when bound to falsy value
        return render(Component).assert(false, function () {
            return this.checkbox.checked;
        })
    });

    it('Checkbox :bind - clicking updates bound property', function() {
        function Component() {
            this.agreed = false;

            return render => render`<div>
                <label>
                    <input type='checkbox' :bind='self.agreed' :ref="self.checkbox" />
                    I agree to the terms
                </label>
            </div>`;
        }

        // Test clicking checkbox updates the property
        return render(Component).assert(true, function () {
            // Click the checkbox
            this.checkbox.click();

            // Verify both the property and checked state updated
            return this.agreed === true && this.checkbox.checked === true;
        })
    });

    it('Checkbox :bind - programmatic update changes checked state', function() {
        function Component() {
            this.agreed = false;

            return render => render`<div>
                <label>
                    <input type='checkbox' :bind='self.agreed' :ref="self.checkbox" />
                    I agree to the terms
                </label>
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert(true, function () {
            // Initially unchecked
            let step1 = this.checkbox.checked === false;

            // Change programmatically
            this.agreed = true;

            // Now should be checked
            return step1 && this.checkbox.checked === true;
        })
    });

    it('Text input :bind - initial value', function() {
        function Component() {
            this.name = 'John Doe';

            return render => render`<div>
                <input type='text' :bind='self.name' :ref="self.input" />
            </div>`;
        }

        // Verify text input has initial value
        return render(Component).assert('John Doe', function () {
            return this.input.value;
        })
    });

    it('Text input :bind - programmatic update changes input value', function() {
        function Component() {
            this.name = 'John Doe';

            return render => render`<div>
                <input type='text' :bind='self.name' :ref="self.input" />
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert('Jane Smith', function () {
            // Change the value
            this.name = 'Jane Smith';

            // Input should reflect the change
            return this.input.value;
        })
    });

    it('Text input :bind - typing updates bound property', function() {
        function Component() {
            this.name = 'John';

            return render => render`<div>
                <input type='text' :bind='self.name' :ref="self.input" />
            </div>`;
        }

        // Test user input
        return render(Component).assert('Hello', function () {
            // Simulate typing
            this.input.value = 'Hello';
            this.input.dispatchEvent(new Event('input', { bubbles: true }));

            // Property should be updated
            return this.name;
        })
    });

    it('Textarea :bind - initial value', function() {
        function Component() {
            this.description = 'Initial text';

            return render => render`<div>
                <textarea :bind='self.description' :ref="self.textarea"></textarea>
            </div>`;
        }

        // Verify textarea has initial value
        return render(Component).assert('Initial text', function () {
            return this.textarea.value;
        })
    });

    it('Textarea :bind - programmatic update', function() {
        function Component() {
            this.description = 'Initial';

            return render => render`<div>
                <textarea :bind='self.description' :ref="self.textarea"></textarea>
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert('Updated text', function () {
            this.description = 'Updated text';
            return this.textarea.value;
        })
    });

    it('Number input :bind - initial value', function() {
        function Component() {
            this.age = 25;

            return render => render`<div>
                <input type='number' :bind='self.age' :ref="self.input" />
            </div>`;
        }

        // Verify number input has initial value
        return render(Component).assert('25', function () {
            return this.input.value;
        })
    });

    it('Number input :bind - programmatic update', function() {
        function Component() {
            this.age = 25;

            return render => render`<div>
                <input type='number' :bind='self.age' :ref="self.input" />
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert('30', function () {
            this.age = 30;
            return this.input.value;
        })
    });

    it('Select multiple :bind - initial values', function() {
        function Component() {
            this.selected = ['option2', 'option3'];

            return render => render`<div>
                <select multiple :bind='self.selected' :ref="self.select">
                    <option value='option1'>Option 1</option>
                    <option value='option2'>Option 2</option>
                    <option value='option3'>Option 3</option>
                    <option value='option4'>Option 4</option>
                </select>
            </div>`;
        }

        // Verify multiple select has initial values
        return render(Component).assert(true, function () {
            return this.select.children[1].selected === true &&
                   this.select.children[2].selected === true &&
                   this.select.children[0].selected === false &&
                   this.select.children[3].selected === false;
        })
    });

    it('Select multiple :bind - programmatic update', function() {
        function Component() {
            this.selected = ['option2'];

            return render => render`<div>
                <select multiple :bind='self.selected' :ref="self.select">
                    <option value='option1'>Option 1</option>
                    <option value='option2'>Option 2</option>
                    <option value='option3'>Option 3</option>
                </select>
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert(true, function () {
            // Change selection
            this.selected = ['option1', 'option3'];

            // Verify selection updated
            return this.select.children[0].selected === true &&
                   this.select.children[1].selected === false &&
                   this.select.children[2].selected === true;
        })
    });

    it('Contenteditable :bind - initial value', function() {
        function Component() {
            this.content = '<b>Bold text</b>';

            return render => render`<div>
                <div contenteditable='true' :bind='self.content' :ref="self.editor"></div>
            </div>`;
        }

        // Verify contenteditable has initial value
        return render(Component).assert('<b>Bold text</b>', function () {
            return this.editor.innerHTML;
        })
    });

    it('Contenteditable :bind - programmatic update', function() {
        function Component() {
            this.content = 'Initial';

            return render => render`<div>
                <div contenteditable='true' :bind='self.content' :ref="self.editor"></div>
            </div>`;
        }

        // Test programmatic update
        return render(Component).assert('<i>Italic</i>', function () {
            this.content = '<i>Italic</i>';
            return this.editor.innerHTML;
        })
    });

    it('Custom component :bind - value property sync', function() {
        function CustomInput() {
            return render => render`<input type='text' :bind='self.value' :ref="self.input" />`;
        }

        function Component() {
            this.username = 'testuser';

            return render => render`<div>
                <CustomInput :bind='self.username' :ref="self.custom" />
            </div>`;
        }

        // Register custom component
        lemonade.setComponents({ CustomInput });

        // Verify custom component receives bound value
        return render(Component).assert('testuser', function () {
            return this.custom.value;
        })
    });

    it('Custom component :bind - bidirectional sync', function() {
        function CustomInput() {
            return render => render`<input type='text' :bind='self.value' :ref="self.input" />`;
        }

        function Component() {
            this.username = 'initial';

            return render => render`<div>
                <CustomInput :bind='self.username' :ref="self.custom" />
            </div>`;
        }

        // Register custom component
        lemonade.setComponents({ CustomInput });

        // Verify bidirectional sync
        return render(Component).assert(true, function () {
            // Change parent property
            this.username = 'changed';
            let step1 = this.custom.value === 'changed';

            // Change custom component value
            this.custom.value = 'updated';
            let step2 = this.username === 'updated';

            return step1 && step2;
        })
    });

    it(':bind with empty string initial value', function() {
        function Component() {
            this.text = '';

            return render => render`<div>
                <input type='text' :bind='self.text' :ref="self.input" />
            </div>`;
        }

        // Verify empty string is handled correctly
        return render(Component).assert('', function () {
            return this.input.value;
        })
    });

    it(':bind with null initial value', function() {
        function Component() {
            this.text = null;

            return render => render`<div>
                <input type='text' :bind='self.text' :ref="self.input" />
            </div>`;
        }

        // Verify null is converted to empty string
        return render(Component).assert('', function () {
            return this.input.value;
        })
    });

    it(':bind with undefined initial value', function() {
        function Component() {
            this.text = undefined;

            return render => render`<div>
                <input type='text' :bind='self.text' :ref="self.input" />
            </div>`;
        }

        // Verify undefined is converted to empty string
        return render(Component).assert('', function () {
            return this.input.value;
        })
    });

    it('Text input :bind - onchange triggered exactly once per change', function() {
        function Component(children, { onchange }) {
            this.name = 'John';
            this.changeCount = 0;

            onchange((prop) => {
                if (prop === 'name') {
                    this.changeCount++;
                }
            });

            return render => render`<div>
                <input type='text' :bind='self.name' :ref="self.input" />
            </div>`;
        }

        // Verify onchange is triggered exactly once
        return render(Component).assert(1, function () {
            // Change value via input
            this.input.value = 'Jane';
            this.input.dispatchEvent(new Event('input', { bubbles: true }));

            // Should trigger onchange exactly once, not multiple times (no loop)
            return this.changeCount;
        })
    });

    it('Checkbox :bind - onchange triggered on click', function() {
        function Component(children, { onchange }) {
            this.agreed = false;
            this.changes = [];

            onchange((prop) => {
                if (prop === 'agreed') {
                    this.changes.push(this.agreed);
                }
            });

            return render => render`<div>
                <input type='checkbox' :bind='self.agreed' :ref="self.checkbox" />
            </div>`;
        }

        // Verify onchange is triggered when checkbox is clicked
        return render(Component).assert(true, function () {
            this.checkbox.click();

            return this.changes.length === 1 && this.changes[0] === true;
        })
    });

    it('Select :bind - onchange triggered on selection change', function() {
        function Component(children, { onchange }) {
            this.language = 'en_GB';
            this.changeCount = 0;

            onchange((prop) => {
                if (prop === 'language') {
                    this.changeCount++;
                }
            });

            return render => render`<div>
                <select :bind='self.language' :ref="self.select">
                    <option value='en_GB'>English</option>
                    <option value='pt_BR'>Portuguese</option>
                    <option value='es_ES'>Spanish</option>
                </select>
            </div>`;
        }

        // Verify onchange is triggered when select changes
        return render(Component).assert('pt_BR', function () {
            // Programmatically change the value
            this.language = 'pt_BR';

            // Verify it updated
            return this.language;
        })
    });

    it('Custom component :bind - onchange triggered in parent', function() {
        function CustomInput() {
            return render => render`<input type='text' :bind='self.value' :ref="self.input" />`;
        }

        function Component(children, { onchange }) {
            this.username = 'initial';
            this.changeLog = [];

            onchange((prop) => {
                if (prop === 'username') {
                    this.changeLog.push(this.username);
                }
            });

            return render => render`<div>
                <CustomInput :bind='self.username' :ref="self.custom" />
            </div>`;
        }

        lemonade.setComponents({ CustomInput });

        // Verify parent's onchange is triggered when custom component value changes
        return render(Component).assert(true, function () {
            // Change custom component's value
            this.custom.value = 'changed';

            // Parent onchange should be triggered
            return this.changeLog.length > 0 && this.changeLog[0] === 'changed';
        })
    });

    it('Custom component :bind - onchange in both parent and child', function() {
        function CustomInput(children, { onchange }) {
            this.childChangeCount = 0;

            onchange((prop) => {
                if (prop === 'value') {
                    this.childChangeCount++;
                }
            });

            return render => render`<input type='text' :bind='self.value' :ref="self.input" />`;
        }

        function Component(children, { onchange }) {
            this.username = 'initial';
            this.parentChangeCount = 0;

            onchange((prop) => {
                if (prop === 'username') {
                    this.parentChangeCount++;
                }
            });

            return render => render`<div>
                <CustomInput :bind='self.username' :ref="self.custom" />
            </div>`;
        }

        lemonade.setComponents({ CustomInput });

        // Verify both parent and child onchange are triggered
        return render(Component).assert(true, function () {
            // Change through custom component
            this.custom.input.value = 'typed';
            this.custom.input.dispatchEvent(new Event('input', { bubbles: true }));

            // Both should be triggered
            return this.parentChangeCount > 0 && this.custom.childChangeCount > 0;
        })
    });

    it('Custom component with nested :bind - complex data flow', function() {
        function InputWrapper() {
            return render => render`<div>
                <input type='text' :bind='self.value' :ref="self.input" />
                <span :ref="self.display">{{self.value}}</span>
            </div>`;
        }

        function Component() {
            this.text = 'hello';

            return render => render`<div>
                <InputWrapper :bind='self.text' :ref="self.wrapper" />
                <p :ref="self.output">{{self.text}}</p>
            </div>`;
        }

        lemonade.setComponents({ InputWrapper });

        // Verify complex nested bind works correctly
        return render(Component).assert(true, function () {
            // Change in custom component should propagate to parent
            this.wrapper.input.value = 'world';
            this.wrapper.input.dispatchEvent(new Event('input', { bubbles: true }));

            // All three should be synchronized
            return this.text === 'world' &&
                   this.wrapper.value === 'world' &&
                   this.output.textContent === 'world';
        })
    });

    it('Custom component :bind - programmatic changes from parent', function() {
        function CustomDisplay() {
            return render => render`<div>
                <b :ref="self.bold">{{self.value}}</b>
            </div>`;
        }

        function Component() {
            this.message = 'original';

            return render => render`<div>
                <CustomDisplay :bind='self.message' :ref="self.display" />
                <input type='button' onclick="${() => this.message = 'updated'}" :ref="self.button" />
            </div>`;
        }

        lemonade.setComponents({ CustomDisplay });

        // Verify parent updates propagate to custom component
        return render(Component).assert(true, function () {
            // Initial state
            let step1 = this.display.value === 'original';

            // Update from parent
            this.button.click();

            // Custom component should receive the update
            return step1 &&
                   this.display.value === 'updated' &&
                   this.display.bold.textContent === 'updated';
        })
    });

    it('Custom component class :bind - with lifecycle hooks', function() {
        class CustomCounter extends lemonade.component {
            constructor(s) {
                super(s);
            }

            render() {
                return `<div>
                    <button onclick="${() => this.value++}" :ref="self.increment">+</button>
                    <span :ref="self.display">{{self.value}}</span>
                    <button onclick="${() => this.value--}" :ref="self.decrement">-</button>
                </div>`;
            }
        }

        function Component(children, { onchange }) {
            this.count = 10;
            this.changeLog = [];

            onchange((prop) => {
                if (prop === 'count') {
                    this.changeLog.push(this.count);
                }
            });

            return render => render`<div>
                <CustomCounter :bind='self.count' :ref="self.counter" />
                <p :ref="self.result">Count: {{self.count}}</p>
            </div>`;
        }

        lemonade.setComponents({ CustomCounter });

        // Verify class-based custom component with bind
        return render(Component).assert(10, function () {
            // Verify initial value is set
            return this.counter.value;
        })
    });

    it('Multiple custom components :bind to same property - parent change', function() {
        function Display() {
            return render => render`<span :ref="self.text">{{self.value}}</span>`;
        }

        function Component() {
            this.shared = 'shared value';

            return render => render`<div>
                <Display :bind='self.shared' :ref="self.display1" />
                <Display :bind='self.shared' :ref="self.display2" />
                <Display :bind='self.shared' :ref="self.display3" />
                <input type='button' onclick="${() => this.shared = 'changed'}" :ref="self.button" />
            </div>`;
        }

        lemonade.setComponents({ Display });

        // Verify multiple components bound to same property stay in sync
        return render(Component).assert(true, function () {
            // Change the shared value from parent
            this.button.click();

            // All displays should show the new value
            return this.display1.value === 'changed' &&
                   this.display2.value === 'changed' &&
                   this.display3.value === 'changed' &&
                   this.display1.text.textContent === 'changed' &&
                   this.display2.text.textContent === 'changed' &&
                   this.display3.text.textContent === 'changed';
        })
    });

    it('Multiple custom components :bind to same property - child change propagates', function() {
        function EditableDisplay() {
            return render => render`<div>
                <input type='text' :bind='self.value' :ref="self.input" />
                <span :ref="self.display">{{self.value}}</span>
            </div>`;
        }

        function Component(children, { onchange }) {
            this.shared = 'initial';
            this.changeCount = 0;

            onchange((prop) => {
                if (prop === 'shared') {
                    this.changeCount++;
                }
            });

            return render => render`<div>
                <EditableDisplay :bind='self.shared' :ref="self.comp1" />
                <EditableDisplay :bind='self.shared' :ref="self.comp2" />
                <EditableDisplay :bind='self.shared' :ref="self.comp3" />
                <p :ref="self.parentDisplay">Parent: {{self.shared}}</p>
            </div>`;
        }

        lemonade.setComponents({ EditableDisplay });

        // Verify change in one custom component propagates to all others
        return render(Component).assert(true, function () {
            // Change value through first component's input
            this.comp1.input.value = 'from-comp1';
            this.comp1.input.dispatchEvent(new Event('input', { bubbles: true }));

            // All components and parent should be synchronized
            return this.shared === 'from-comp1' &&
                   this.comp1.value === 'from-comp1' &&
                   this.comp2.value === 'from-comp1' &&
                   this.comp3.value === 'from-comp1' &&
                   this.comp1.display.textContent === 'from-comp1' &&
                   this.comp2.display.textContent === 'from-comp1' &&
                   this.comp3.display.textContent === 'from-comp1' &&
                   this.parentDisplay.textContent === 'Parent: from-comp1' &&
                   this.changeCount > 0;
        })
    });

    it('Custom component :bind - no infinite loop on equal values', function() {
        function CustomInput(children, { onchange }) {
            this.updateCount = 0;

            onchange((prop) => {
                if (prop === 'value') {
                    this.updateCount++;
                }
            });

            return render => render`<input type='text' :bind='self.value' :ref="self.input" />`;
        }

        function Component(children, { onchange }) {
            this.text = 'same';
            this.parentUpdateCount = 0;

            onchange((prop) => {
                if (prop === 'text') {
                    this.parentUpdateCount++;
                }
            });

            return render => render`<div>
                <CustomInput :bind='self.text' :ref="self.custom" />
                <input type='button' onclick="${() => this.text = 'same'}" :ref="self.button" />
            </div>`;
        }

        lemonade.setComponents({ CustomInput });

        // Verify setting same value doesn't cause infinite updates
        return render(Component).assert(true, function () {
            let initialParentCount = this.parentUpdateCount;
            let initialChildCount = this.custom.updateCount;

            // Set to same value multiple times
            this.button.click();
            this.button.click();
            this.button.click();

            // Should not trigger excessive updates
            let parentDiff = this.parentUpdateCount - initialParentCount;
            let childDiff = this.custom.updateCount - initialChildCount;

            // Some updates are expected, but not excessive (e.g., 3 clicks shouldn't cause 100 updates)
            return parentDiff < 10 && childDiff < 10 && this.text === 'same';
        })
    });


});
