import lemonade from '../dist/lemonade';
import tester from '../dist/tester';

tester('Tracking sub-level object properties from the self', function(render) {
    // Lemonade Component
    function Component () {
        let self = this;
        self.test = {
            value: 123,
        }
        // Title and year are declared in the parent template
        let template = `<div class="p10">
            <h1 :ref="self.title">{{self.test.value}}</h1>
            <input type="button" onclick="self.test.value++" :ref="self.button" />
          </div>`;

        return lemonade.element(template, self);
    }

    // Render the component and assert the return
    return render(Component).assert(124, function() {
        let self = this;
        // Simulate the click in the button
        //self.button.click();
        // Return the value
        return self.test.value;
    })
})();