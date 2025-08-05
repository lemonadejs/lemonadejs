describe('Render', () => {

    it('State', function() {
        function Component(children, { state }) {
            let status = state(false);

            const update = () => {
                status.value = ! status.value;
            }

            return render => render`<div>
                <p><input type="checkbox" checked="${status}" /></p>
                <input type="button" value="Toggle" onclick="${update}"/>
            </div>`
        }

        // Render the component and assert the return
        return render(Component).assert(true, function () {
            let self = this;
            self.el.lastChild.click();
            return self.el.firstChild.firstChild.checked
        })
    });

});