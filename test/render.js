describe('Render', () => {

    it('Render using expressions', function() {
        // Get the attributes from the tag
        function Component() {
            this.test = 'input';
            return render => render`
                <div>
                    <div :render="${this.test==='input'}">
                        <input type="text" />
                    </div>
                    <div :render="${this.test==='calendar'}">
                        <input type="calendar" />
                    </div>
                </div>
            `;
        }

        // Render the component and assert the return
        return render(Component).assert('calendar', function () {
            let self = this;
            self.test = 'calendar';
            return self.el.lastChild.firstChild.getAttribute('type');
        })
    });

    it('Render using states', function() {
        // Get the attributes from the tag
        function Component(children, { state }) {
            let data = state(false);
            return render => render`
                <div>
                    <div :render="${data}">
                        <input type="calendar" />
                    </div>
                    <input type="button" onclick="${()=>data.value = true}"/>
                </div>
            `;
        }

        // Render the component and assert the return
        return render(Component).assert('calendar', function () {
            let self = this;
            self.el.lastChild.click();
            return self.el.firstChild.firstChild.getAttribute('type');
        })
    });

});