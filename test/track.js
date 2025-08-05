describe('Render', () => {

    it('Track', function() {
        function Component(children, { track, onchange }) {
            track('test');

            onchange(prop => {
                this.control = this.test;
            })

            return render => render`<div>
                <input type="button" value="Toggle" onclick="${() => this.test = true}"/>
            </div>`
        }

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            this.el.lastChild.click();
            return this.control;
        })
    });

});