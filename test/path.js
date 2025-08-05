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


});