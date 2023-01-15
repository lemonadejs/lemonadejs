/*
// This test only works with 3 conditions
// npm install @lemonadejs/tester
// make sure to specify the extension of your files when using import
// having type="module" on package.json when running the tests (you can add and remove after the tests)

import App from '../src/App.js';

test('Testing App.js sample', function(render) {
    // Render the component and assert the return
    return render(App).assert('Hello world', function() {
        let self = this;
        return self.component.el.textContent;
    })
});
*/