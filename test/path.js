describe('Path', () => {

    it('Using setPath', function() {
        /**
         * Component
         */
        const Component = function(children, { setPath }) {
            let [ form, setForm ] = setPath(null);

            setForm({
                options: {
                    mask: 123,
                },
            })

            return render => render`<div>
                <input type='text' lm-path="options.mask" :ref="self.test" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('123', function () {
            return this.test.value;
        })
    });

    it('setPath setValue should sync data object', function() {
        /**
         * Test that when setValue (setData) is called after render,
         * both the input element AND the data object are updated.
         * This is a regression test for the bug where setData only
         * updated input elements but not the data object.
         */
        const Component = function(children, { setPath, onload }) {
            let self = this;
            let [ data, setData ] = setPath({});

            self.data = data;
            self.setData = setData;

            return render => render`<div>
                <input type='text' lm-path="user_name" :ref="self.nameInput" />
                <input type='text' lm-path="user_email" :ref="self.emailInput" />
            </div>`;
        }

        // Render the component and assert that data object is synced
        return render(Component).assert(true, function () {
            // Call setData after component is rendered
            this.setData({
                user_name: 'John Doe',
                user_email: 'john@example.com'
            });

            // Verify input elements are updated
            const inputsUpdated = this.nameInput.value === 'John Doe' &&
                                  this.emailInput.value === 'john@example.com';

            // Verify data object is also updated (this was the bug)
            const dataUpdated = this.data.user_name === 'John Doe' &&
                               this.data.user_email === 'john@example.com';

            return inputsUpdated && dataUpdated;
        })
    });

    it('setPath setValue should handle nested paths in data object', function() {
        /**
         * Test that nested paths are properly synced to the data object
         */
        const Component = function(children, { setPath }) {
            let self = this;
            let [ data, setData ] = setPath({});

            self.data = data;
            self.setData = setData;

            return render => render`<div>
                <input type='text' lm-path="profile.name" :ref="self.nameInput" />
                <input type='text' lm-path="profile.settings.theme" :ref="self.themeInput" />
            </div>`;
        }

        return render(Component).assert(true, function () {
            this.setData({
                profile: {
                    name: 'Jane',
                    settings: {
                        theme: 'dark'
                    }
                }
            });

            // Verify nested data object is synced
            return this.data.profile?.name === 'Jane' &&
                   this.data.profile?.settings?.theme === 'dark';
        })
    });

    it('setPath setValue with empty object should set empty strings not undefined', function() {
        /**
         * Test that calling setData({}) sets empty strings on the data object,
         * not undefined values. This matches form element behavior where
         * inputs have empty string values, not undefined.
         */
        const Component = function(children, { setPath }) {
            let self = this;
            let [ data, setData ] = setPath({});

            self.data = data;
            self.setData = setData;

            return render => render`<div>
                <input type='text' lm-path="user_name" :ref="self.nameInput" />
                <input type='text' lm-path="user_email" :ref="self.emailInput" />
            </div>`;
        }

        return render(Component).assert(true, function () {
            // First set some values
            this.setData({
                user_name: 'John',
                user_email: 'john@example.com'
            });

            // Then clear with empty object
            this.setData({});

            // Data object should have empty strings, not undefined
            return this.data.user_name === '' &&
                   this.data.user_email === '' &&
                   this.nameInput.value === '' &&
                   this.emailInput.value === '';
        })
    });

});