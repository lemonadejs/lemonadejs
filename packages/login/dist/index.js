// Load jSuites
if (! jSuites && typeof(require) === 'function') {
    var jSuites = require('jsuites');
}

// Load jSuites
if (! sha512 && typeof(require) === 'function') {
    var sha512 = require('@jsuites/sha512');
}

// Load LemonadeJS
if (! lemonade && typeof(require) === 'function') {
    var lemonade = require('lemonadejs');
}

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Login = factory();
}(this, (function () {

    const T = jSuites.translate;

    /**
     * The element passed is a DOM element
     */
    const isDOM = function(o) {
        return (o instanceof Element || o instanceof HTMLDocument);
    }

    const Component = function(template) {
        let self = this;

        // Url
        let url = self.url || window.location.pathname;

        // Device token
        if (self.device) {
            url += '?token=' + self.device;
        }

        /**
         * Create the correct form for each action
         */
        self.appendChild = function(elements, instructions) {
            self.container.innerHTML = '';

            for (let i = 0; i < elements.length; i++) {
                let element = self['container'+elements[i]];
                if (element && element.getAttribute('data-visible') !== 'false') {
                    self.container.appendChild(element);
                }
            }

            // Show instructions to the user
            self.instructions = T(instructions) || '';
        }

        /**
         * Setup the action button with the necessary steps
         */
        self.createAction = function(title, button, action) {
            // Message
            self.alert = '';
            // Show the text for the button action
            self.action.value = T(button);
            // Bind the onclick action
            self.action.onclick = action;
            // Update title
            self.title = T(title);
            // Other adjustments
            if (typeof(self.onupdate) === 'function') {
                self.onupdate(self, text);
            }
        }

        self.enter = function(e) {
            if (e.key === 'Enter') {
                self.action.onclick();
                e.preventDefault();
            }
        }

        self.blur = function(element) {
            // Validation
            let validation = element.getAttribute('data-validation');
            if (validation) {
                if (!jSuites.validations[validation](element.value)) {
                    element.classList.add('error')
                } else {
                    element.classList.remove('error')
                }
            }
        }

        /**
         * Perform the ajax call to the server
         */
        self.request = function(data, callback) {
            // Loading
            self.el.classList.add('jlogin-loading');
            // Data
            self.data = data;
            // Save email to the localStorage
            if (data.username) {
                window.localStorage.setItem('username', data.username);
            }
            // Captcha
            if (self.containerCaptcha.parentNode) {
                data.captcha = self.captcha;
            }

            // Remote call
            jSuites.ajax({
                url: url,
                method: 'POST',
                dataType: 'json',
                data: self.data,
                beforeSend: function(xhr) {
                    xhr.withCredentials = true;
                },
                success: function(result) {
                    // Remove loading
                    self.el.classList.remove('jlogin-loading');

                    // Message
                    if (result.message) {
                        jSuites.notification(result);
                    }

                    // App initialization
                    if (result.success == 1) {
                        // Callback
                        if (callback && callback(result) === false) {
                            return false;
                        }
                        // Action from the server
                        if (result.action && result.action === 'resetPassword') {
                            self.resetPassword(result.hash);
                            return false;
                        }

                        if (typeof(self.onsuccess) == 'function') {
                            self.onsuccess.call(self, result, data);
                        } else {
                            // Some time so the user can see the message before the redirect
                            if (result.message) {
                                setTimeout(function() {
                                    if (result.url) {
                                        window.location.href = result.url;
                                    } else {
                                        window.location.href = window.location.pathname;
                                    }
                                }, 3000);
                            } else {
                                if (result.url) {
                                    window.location.href = result.url;
                                } else {
                                    window.location.href = window.location.pathname;
                                }
                            }
                        }
                    } else {
                        // Event
                        if (typeof(self.onerror) == 'function') {
                            self.onerror(result);
                        }

                        self.alert = result.message;
                    }

                    // Catcha
                    if (result.data) {
                        // Add captcha container to the screen
                        self.container.insertBefore(self.containerCaptcha, self.containerAction);
                        // Add captcha image
                        self.captchaImage.setAttribute('src', 'data:image/png;base64,' + result.data);
                    }
                },
                error: function(result) {
                    // Error
                    self.el.classList.remove('jlogin-loading');

                    // Message
                    self.error(result.message);

                    // Event
                    if (typeof(self.onerror) == 'function') {
                        self.onerror(result);
                    }
                }
            });
        }

        /**
         * Create the request access form
         */
        self.requestAccess = function() {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Email','Password','Action','Google','Facebook','Remember','Request','Profile']);

            // Action
            self.createAction('Login', 'Login', function() {
                self.request({
                    username: self.email,
                    password: sha512(self.password),
                    remember: self.remember,
                })
            });
        }

        /**
         * Access with google
         */
        self.loginWithGoogle = function() {
            if (typeof(google) === 'undefined') {
                alert('Google API not found');
            } else if (! self['google-client-id']) {
                alert('Google Client ID not defined');
            } else {
                try {
                    if (self.action.value === T('Create a new account')) {
                        if (typeof (self.onbeforecreate) === 'function') {
                            self.onbeforecreate(self);
                        }
                    }

                    google.accounts.id.initialize({
                        client_id: self['google-client-id'],
                        auto_select: true,
                        callback: function (response) {
                            self.request({
                                social: 'google',
                                token: response.credential,
                                terms: self.terms
                            }, function (result) {
                                if (result.action === 'bindSocialAccount') {
                                    self.bindSocialAccount(result);
                                    return false;
                                } else if (result.action === 'acceptTermsAndConditions') {
                                    self.acceptTermsAndConditions(result);
                                    return false;
                                }
                            });
                        }
                    });

                    google.accounts.id.prompt(function (notification) {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            google.accounts.id.renderButton(
                                self.containerGoogle, {
                                    theme: "outline",
                                    size: "large",
                                    width: self.containerGoogle.offsetWidth,
                                    text: 'signin_with',
                                }
                            );
                        }
                    });
                } catch (e) {
                    self.error(e);
                }
            }
        }

        /**
         * Access with facebook
         */
        self.loginWithFacebook = function() {
            if (typeof(FB) === 'undefined') {
                self.error('Facebook API not found');
            } else {
                var Request = function(response) {
                    if (self.action.value === T('Create a new account')) {
                        if (typeof (self.onbeforecreate) === 'function') {
                            self.onbeforecreate(self);
                        }
                    }

                    self.request({
                        social: 'facebook',
                        token: response.authResponse,
                        terms: self.terms
                    }, function (result) {
                        if (result.action === 'bindSocialAccount') {
                            self.bindSocialAccount(result);
                            return false;
                        } else if (result.action === 'acceptTermsAndConditions') {
                            self.acceptTermsAndConditions(result);
                            return false;
                        }
                    });
                }

                FB.getLoginStatus(function(response) {
                    if (! response.status || response.status != 'connected') {
                        FB.login(function(response) {
                            if (response.authResponse) {
                                Request(response);
                            } else {
                                self.error('Not authorized by facebook');
                            }
                        }, { scope: 'public_profile,email' });
                    } else {
                        Request(response);
                    }
                }, true);
            }
        }

        /**
         * Bind accounts
         */
        self.bindSocialAccount = function() {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Password','Action','Cancel'], 'Please enter your password to bind your account.');

            // Create action
            self.createAction('Bind accounts', 'Bind accounts', function() {
                try {
                    if (! self.password) {
                        throw('Password is mandatory');
                    }

                    self.request({
                        ...self.data,
                        password: sha512(self.password),
                    });
                } catch (e) {
                    self.error(e);
                }
            })
        }

        /**
         * Request a new password
         */
        self.requestPassword = function(h) {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Email','Action','Cancel']);

            // Action
            self.createAction('Request a new password', 'Request a new password', function() {
                try {
                    if (!jSuites.validations.email(self.email)) {
                        throw('Invalid e-mail address');
                    }

                    self.request({
                        username: self.email,
                        recovery: 1,
                    }, function () {
                        self.submitCode();
                        return false;
                    });
                } catch (e) {
                    self.error(e);
                }
            });
        }

        /**
         * Submit a code to the server to change password
         */
        self.submitCode = function() {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Code','Action','Cancel'], 'Please enter the code you have received by email or message');

            // Action
            self.createAction('Confirm code', 'Confirm code', function() {
                try {
                    if (self.code.length !== 6) {
                        throw('The code should has 6 digits');
                    }

                    self.request({
                        h: sha512(self.code),
                    }, function() {
                        // Form to reset the password
                        self.resetPassword(sha512(self.code));
                        return false;
                    })
                } catch (e) {
                    self.error(e);
                }
            });
        }

        /**
         * Reset the user password
         */
        self.resetPassword = function(h) {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Password','Repeat','Action','Cancel']);

            // Reset inputs
            self.password = '';
            self.password2 = '';

            // Instructions
            self.instructions = 'Please choose a new password';

            // Action
            self.createAction('Reset my password', 'Reset my password', function() {
                try {
                    if (! self.password) {
                        throw('You need to choose a new password');
                    }
                    if (self.password !== self.password2) {
                        throw('The passwords must match');
                    }

                    self.request({
                        h: h,
                        password: sha512(self.password),
                    })
                } catch (e) {
                    self.error(e);
                }
            });
        }

        /**
         * Create a new account
         */
        self.createAccount = function() {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Name','Username','Email','Action','Google','Terms','Cancel']);

            // Action
            self.createAction('Create a new account', 'Create a new account', function() {
                try {
                    if (typeof(self.onbeforecreate) === 'function') {
                        self.onbeforecreate(self);
                    }
                    if (! jSuites.validations.email(self.email)) {
                        throw('Invalid e-mail address');
                    }
                    if (! jSuites.validations.login(self.username)) {
                        throw('Invalid username, please use only characters and numbers');
                    }

                    self.request({
                        name: self.name,
                        login: self.username,
                        username: self.email,
                        terms: self.terms,
                    });
                } catch (e) {
                    self.error(e);
                }
            });
        }

        self.acceptTermsAndConditions = function(result) {
            // Start with correct elements
            self.appendChild(['Logo','Instructions','Action','Terms','Cancel']);

            // Instructions
            if (result.message) {
                self.instructions = result.message;
            }

            // Action
            self.createAction('Terms and conditions', 'Continue', function() {
                try {
                    if (typeof(self.onbeforecreate) === 'function') {
                        self.onbeforecreate(self);
                    }

                    self.request({
                        ...self.data,
                        terms: self.terms,
                    });
                } catch (e) {
                    self.error(e);
                }
            });
        }

        self.error = function(message) {
            self.alert = message;
            jSuites.notification({ error: 1, message: message });
        }

        self.cancel = function() {
            self.requestAccess();
        }

        self.onload = function() {
            // Email persistence
            if (window.localStorage.getItem('username')) {
                self.email = window.localStorage.getItem('username');
            }
            // Logo
            if (self.logo) {
                let logo = document.createElement('img');
                logo.src = self.logo;
                self.containerLogo.appendChild(logo);
            }
            // Fullscreen
            if (self.fullscreen) {
                self.el.classList.add('jlogin-fullscreen');
            }
            // Initial action
            let params = new URLSearchParams(window.location.search);
            if (params.get('create') === null) {
                let hash = params.get('h');
                if (hash) {
                    self.resetPassword(hash);
                } else {
                    self.requestAccess();
                }

                // Focus on the email box
                self.emailInput.focus();
            } else {
                self.createAccount();

                // Focus on the email box
                self.nameInput.focus();
            }
        }

        return `<div class="jlogin">
            <h1>{{self.title}}</h1>
            <div class="alert">{{self.alert}}</div>
            <form @ref="self.container">
                <div @ref="self.containerLogo" class="jlogin-logo" data-visible="{{self.logo?true:false}}"></div>
                <div @ref="self.containerInstructions" class="jlogin-instructions">
                    <div>{{self.instructions}}</div>
                </div>
                <div @ref="self.containerCaptcha" class="jlogin-captcha">
                    <label>Security code</label>
                    <input type="title" name="captcha" @bind="self.captcha">
                    <img @ref="self.captchaImage" />
                </div>
                <div @ref="self.containerCode">
                    <label>Code</label>
                    <input type="title" name="code" @bind="self.code" onkeypress="self.enter(e)">
                </div>
                <div @ref="self.containerName">
                    <label>Name</label>
                    <input type="title" name="name" @bind="self.name" @ref="self.nameInput">
                </div>
                <div @ref="self.containerUsername">
                    <label>Username</label>
                    <input type="title" name="username" autocomplete="new-username" @bind="self.username">
                </div>
                <div @ref="self.containerEmail">
                    <label>E-mail</label>
                    <input type="title" name="email" data-validation="email" autocomplete="new-username" @bind="self.email" @ref="self.emailInput" onkeypress="self.enter(e)" onblur="self.blur(this)">
                </div>
                <div @ref="self.containerPassword">
                    <label>Password</label>
                    <input type="password" name="password" autocomplete="new-password" @bind="self.password" onkeypress="self.enter(e)">
                </div>
                <div @ref="self.containerRepeat">
                    <label>Repeat the password</label>
                    <input type="password" name="password2" autocomplete="new-password" @bind="self.password2" onkeypress="self.enter(e)">
                </div>
                <div @ref="self.containerAction">
                    <input type="button" value="Login" @ref="self.action">
                </div>
                <div @ref="self.containerCancel" class="jlogin-button">
                    <span onclick="self.cancel()">Cancel</span>
                </div>
                <div @ref="self.containerGoogle" data-visible="{{self.google}}">
                    <input type="button" value="Login with Google" class="googleButton" onclick="self.loginWithGoogle()">
                </div>
                <div @ref="self.containerFacebook" data-visible="{{self.facebook}}">
                    <input type="button" value="Login with Facebook" class="facebookButton" onclick="self.loginWithFacebook()">
                </div>
                <div @ref="self.containerRequest" class="jlogin-button">
                    <span onclick="self.requestPassword()">Request a new password</span>
                </div>
                <div @ref="self.containerProfile" class="jlogin-button" data-visible="{{self.profile}}">
                    <span onclick="self.createAccount()">Create a new profile</span>
                </div>
                <div @ref="self.containerRemember" class="p10" data-visible="{{self.remember}}">
                    <label><input type="checkbox" value="1" @bind="self.remember" style="float: none"> <span>Remember me on this device</span></label>
                </div>
                ${template}
            </form>
        </div>`;
    }

    return function(a, b) {
        if (isDOM(a)) {
            lemonade.render(Component, a, b);
        } else {
            return Component.call(this, a);
        }
    }

})));