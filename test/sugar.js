describe('Sugar - Global State Management', () => {

    it('set() and get() - store and retrieve self globally', function() {
        function ProfileComponent() {
            // Register self globally
            lemonade.set('test:profile', this);
            this.name = 'Initial Name';
            this.email = 'initial@test.com';

            return render => render`<div>
                <p :ref="self.nameDisplay">{{self.name}}</p>
                <p :ref="self.emailDisplay">{{self.email}}</p>
            </div>`;
        }

        function UpdaterComponent() {
            const update = () => {
                // Get the profile self
                let profile = lemonade.get('test:profile');
                profile.name = 'Updated Name';
                profile.email = 'updated@test.com';
            };

            return render => render`<div>
                <input type="button" value="Update" onclick="${update}" :ref="self.button" />
            </div>`;
        }

        lemonade.setComponents({ ProfileComponent, UpdaterComponent });

        function App() {
            return render => render`<div>
                <ProfileComponent :ref="self.profile" />
                <UpdaterComponent :ref="self.updater" />
            </div>`;
        }

        // Render and test
        return render(App).assert(true, function() {
            // Click update button
            this.updater.button.click();

            // Verify profile was updated
            return this.profile.name === 'Updated Name' &&
                   this.profile.email === 'updated@test.com' &&
                   this.profile.nameDisplay.textContent === 'Updated Name' &&
                   this.profile.emailDisplay.textContent === 'updated@test.com';
        });
    });

    it('dispatch() - trigger actions across components', function() {
        function ReceiverComponent() {
            this.message = 'No message';
            this.count = 0;

            // Subscribe to dispatcher
            lemonade.set('test:update', (data) => {
                this.message = data.message;
                this.count++;
            });

            return render => render`<div>
                <p :ref="self.display">{{self.message}}</p>
                <span :ref="self.counter">{{self.count}}</span>
            </div>`;
        }

        function SenderComponent() {
            const send = () => {
                lemonade.dispatch('test:update', {
                    message: 'Hello from sender!'
                });
            };

            return render => render`<div>
                <input type="button" value="Send" onclick="${send}" :ref="self.sendButton" />
            </div>`;
        }

        lemonade.setComponents({ ReceiverComponent, SenderComponent });

        function App() {
            return render => render`<div>
                <ReceiverComponent :ref="self.receiver" />
                <SenderComponent :ref="self.sender" />
            </div>`;
        }

        // Render and test
        return render(App).assert(true, function() {
            // Send message
            this.sender.sendButton.click();

            // Verify receiver got the message
            return this.receiver.message === 'Hello from sender!' &&
                   this.receiver.count === 1 &&
                   this.receiver.display.textContent === 'Hello from sender!' &&
                   this.receiver.counter.textContent === '1';
        });
    });

    it('dispatch() - multiple dispatches to same action', function() {
        function CounterComponent() {
            this.total = 0;

            lemonade.set('test:increment', (data) => {
                this.total += data.amount;
            });

            return render => render`<div>
                <span :ref="self.totalDisplay">{{self.total}}</span>
            </div>`;
        }

        function ButtonsComponent() {
            const add5 = () => lemonade.dispatch('test:increment', { amount: 5 });
            const add10 = () => lemonade.dispatch('test:increment', { amount: 10 });

            return render => render`<div>
                <input type="button" value="+5" onclick="${add5}" :ref="self.btn5" />
                <input type="button" value="+10" onclick="${add10}" :ref="self.btn10" />
            </div>`;
        }

        lemonade.setComponents({ CounterComponent, ButtonsComponent });

        function App() {
            return render => render`<div>
                <CounterComponent :ref="self.counter" />
                <ButtonsComponent :ref="self.buttons" />
            </div>`;
        }

        // Render and test
        return render(App).assert(25, function() {
            // Click buttons
            this.buttons.btn5.click();
            this.buttons.btn10.click();
            this.buttons.btn10.click();

            // Total should be 5 + 10 + 10 = 25
            return this.counter.total;
        });
    });

    // @todo: implement multiple events for the same alias
    xit('Multiple components subscribe to same dispatcher', function() {
        function DisplayComponent() {
            this.value = 0;

            lemonade.set('test:broadcast', (data) => {
                this.value = data.value;
            });

            return render => render`<div>
                <span :ref="self.display">{{self.value}}</span>
            </div>`;
        }

        function BroadcasterComponent() {
            const broadcast = () => {
                lemonade.dispatch('test:broadcast', { value: 42 });
            };

            return render => render`<div>
                <input type="button" value="Broadcast" onclick="${broadcast}" :ref="self.broadcastBtn" />
            </div>`;
        }

        lemonade.setComponents({ DisplayComponent, BroadcasterComponent });

        function App() {
            return render => render`<div>
                <DisplayComponent :ref="self.display1" />
                <DisplayComponent :ref="self.display2" />
                <DisplayComponent :ref="self.display3" />
                <BroadcasterComponent :ref="self.broadcaster" />
            </div>`;
        }

        // Render and test
        return render(App).assert(true, function() {
            // Broadcast to all displays
            this.broadcaster.broadcastBtn.click();

            // All displays should show the same value
            return this.display1.value === 42 &&
                   this.display2.value === 42 &&
                   this.display3.value === 42 &&
                   this.display1.display.textContent === '42' &&
                   this.display2.display.textContent === '42' &&
                   this.display3.display.textContent === '42';
        });
    });

    it('set() with private scope - secure action registration', function() {
        function SecureComponent() {
            // Private properties
            let privateData = 'secret';
            this.publicData = 'visible';

            // Register only specific action, not entire self
            lemonade.set('test:updatePublic', (data) => {
                this.publicData = data.value;
                // privateData remains inaccessible from outside
            });

            return render => render`<div>
                <p :ref="self.publicDisplay">{{self.publicData}}</p>
            </div>`;
        }

        function ExternalComponent() {
            const tryUpdate = () => {
                // Can only update through dispatcher, not direct access
                lemonade.dispatch('test:updatePublic', { value: 'changed' });
            };

            return render => render`<div>
                <input type="button" value="Update" onclick="${tryUpdate}" :ref="self.updateBtn" />
            </div>`;
        }

        lemonade.setComponents({ SecureComponent, ExternalComponent });

        function App() {
            return render => render`<div>
                <SecureComponent :ref="self.secure" />
                <ExternalComponent :ref="self.external" />
            </div>`;
        }

        // Render and test
        return render(App).assert('changed', function() {
            // Update through dispatcher
            this.external.updateBtn.click();

            // Public data should be updated
            return this.secure.publicData;
        });
    });

    it('Chaining multiple set() registrations', function() {
        function MultiListenerComponent() {
            this.name = '';
            this.email = '';
            this.phone = '';

            lemonade.set('test:updateName', (data) => {
                this.name = data.value;
            });

            lemonade.set('test:updateEmail', (data) => {
                this.email = data.value;
            });

            lemonade.set('test:updatePhone', (data) => {
                this.phone = data.value;
            });

            return render => render`<div>
                <p :ref="self.nameDisplay">{{self.name}}</p>
                <p :ref="self.emailDisplay">{{self.email}}</p>
                <p :ref="self.phoneDisplay">{{self.phone}}</p>
            </div>`;
        }

        function TriggerComponent() {
            const updateAll = () => {
                lemonade.dispatch('test:updateName', { value: 'John' });
                lemonade.dispatch('test:updateEmail', { value: 'john@test.com' });
                lemonade.dispatch('test:updatePhone', { value: '555-1234' });
            };

            return render => render`<div>
                <input type="button" value="Update All" onclick="${updateAll}" :ref="self.updateBtn" />
            </div>`;
        }

        lemonade.setComponents({ MultiListenerComponent, TriggerComponent });

        function App() {
            return render => render`<div>
                <MultiListenerComponent :ref="self.listener" />
                <TriggerComponent :ref="self.trigger" />
            </div>`;
        }

        // Render and test
        return render(App).assert(true, function() {
            // Trigger all updates
            this.trigger.updateBtn.click();

            // All fields should be updated
            return this.listener.name === 'John' &&
                   this.listener.email === 'john@test.com' &&
                   this.listener.phone === '555-1234' &&
                   this.listener.nameDisplay.textContent === 'John' &&
                   this.listener.emailDisplay.textContent === 'john@test.com' &&
                   this.listener.phoneDisplay.textContent === '555-1234';
        });
    });

    it('get() returns undefined for non-existent keys', function() {
        function TestComponent() {
            const check = () => {
                this.result = lemonade.get('non:existent:key');
            };

            return render => render`<div>
                <input type="button" value="Check" onclick="${check}" :ref="self.checkBtn" />
            </div>`;
        }

        // Render and test
        return render(TestComponent).assert(true, function() {
            this.checkBtn.click();
            return this.result === undefined;
        });
    });

});
