;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Login = factory();
}(this, (function () {

    // Load jSuites
    if (typeof(jSuites) == 'undefined') {
        if (typeof(require) === 'function') {
            var jSuites = require('jsuites');
        } else if (window.jSuites) {
            var jSuites = window.jSuites;
        }
    }

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    var T = jSuites.translate;

    /**
     * The element passed is a DOM element
     */
    var isDOM = function(o) {
        return (o instanceof Element || o instanceof HTMLDocument);
    }

    var Component = function(template) {
        var self = this;

        // Url
        var url = self.url || window.location.pathname;

        // Device token
        if (self.device) {
            url += '?token=' + self.device;
        }

        /**
         * Create the correct form for each action
         */
        self.appendChild = function(elements, instructions) {
            self.container.innerHTML = '';

            var element = null;
            for (var i = 0; i < elements.length; i++) {
                element = self['container'+elements[i]];
                if (element.getAttribute('data-visible') !== 'false') {
                    self.container.appendChild(element);
                }
            }

            // Show instructions to the user
            self.instructions = T(instructions) || '';
        }

        /**
         * Setup the action button with the necessary steps
         */
        self.createAction = function(text, action) {
            // Show the text for the button action
            self.action.value = T(text);
            // Bind the onclick action
            self.action.onclick = action;
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

                    // Callback
                    if (callback && callback(result) === false) {
                        return false;
                    }

                    // Action from the server
                    if (result.action && result.action === 'resetPassword') {
                        self.resetPassword(result.hash);
                        return false;
                    }

                    // App initialization
                    if (result.success == 1) {
                        if (typeof(self.onsuccess) == 'function') {
                            self.onsuccess.call(self, result, data);
                        } else if (result.url) {
                            // Some time so the user can see the message before the redirect
                            if (result.message) {
                                setTimeout(function() {
                                    window.location.href = result.url;
                                }, 2000);
                            } else {
                                window.location.href = result.url;
                            }
                        } else {
                            window.location.href = window.location.pathname;
                        }
                    } else {
                        // Event
                        if (typeof(self.onerror) == 'function') {
                            self.onerror(result);
                        }
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
                    if (result.message) {
                        jSuites.notification(result);
                    }

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
            self.appendChild(['Logo','Instructions','Email','Password','Action','Google','Facebook','Request','Profile']);

            // Action
            self.createAction('Login', function() {
                self.request({
                    username: self.email,
                    password: sha512(self.password),
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
                google.accounts.id.initialize({
                    client_id: self['google-client-id'],
                    auto_select: true,
                    callback: function (response) {
                        self.request({
                            social: 'google',
                            token: response.credential
                        }, function (result) {
                            if (result.action === 'bindSocialAccount') {
                                self.bindSocialAccount();
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
                    self.request({
                        social: 'facebook',
                        token: response.authResponse
                    }, function (result) {
                        if (result.action === 'bindSocialAccount') {
                            self.bindSocialAccount();
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
            self.createAction('Bind accounts', function() {
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
            self.createAction('Request a new password', function() {
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
            self.appendChild(['Logo','Instructions','Code','Action','Cancel'], 'Please enter the code you by email or message');

            // Action
            self.createAction('Confirm code', function() {
                try {
                    if (self.code.length != 6) {
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

            // Action
            self.createAction('Reset my password', function() {
                try {
                    if (! self.password) {
                        throw('You need to choose a new password');
                    }
                    if (self.password != self.password2) {
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
            self.appendChild(['Logo','Instructions','Name','Username','Email','Action','Cancel']);

            // Action
            self.createAction('Create a new account', function() {
                try {
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
                    });
                } catch (e) {
                    self.error(e);
                }
            });
        }

        self.error = function(message) {
            jSuites.notification({ error: 1, message: message });
        }

        self.cancel = function() {
            self.requestAccess();
        }

        self.onload = function() {
            var params = new URLSearchParams(window.location.search);
            var hash = null;
            if (hash = params.get('h')) {
                self.resetPassword(hash);
            } else {
                self.requestAccess();
            }

            // Email persistence
            if (window.localStorage.getItem('username')) {
                self.email = window.localStorage.getItem('username');
            }

            // Focus on the email box
            self.emailInput.focus();
        }

        var template = `
            <div class="jlogin">
                <form @ref="self.container">
                    <div @ref="self.containerLogo" class="jlogin-logo" data-visible="{{self.logo?true:false}}">
                        <img src="${self.logo}" />
                    </div>
                    <div @ref="self.containerInstructions" class="jlogin-instructions">
                        <div>{{self.instructions}}</div>
                    </div>
                    <div @ref="self.containerCaptcha" class="jlogin-captcha">
                        <label>Security code</label>
                        <input type="text" name="captcha" @bind="self.captcha">
                        <img @ref="self.captchaImage" />
                    </div>
                    <div @ref="self.containerCode">
                        <label>Code</label>
                        <input type="text" name="code" @bind="self.code">
                    </div>
                    <div @ref="self.containerName">
                        <label>Name</label>
                        <input type="text" name="name">
                    </div>
                    <div @ref="self.containerUsername">
                        <label>Username</label>
                        <input type="text" name="username" autocomplete="new-username" @bind="self.username">
                    </div>
                    <div @ref="self.containerEmail">
                        <label>E-mail</label>
                        <input type="text" name="email" autocomplete="new-username" @bind="self.email" @ref="self.emailInput">
                    </div>
                    <div @ref="self.containerPassword">
                        <label>Password</label>
                        <input type="password" name="password" autocomplete="new-password" @bind="self.password">
                    </div>
                    <div @ref="self.containerRepeat">
                        <label>Repeat the password</label>
                        <input type="password" name="password2" autocomplete="new-password" @bind="self.password2">
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
                </form>
            </div>`;

        return lemonade.template(template, self)
    }

    return function(a, b) {
        if (isDOM(a)) {
            lemonade.render(Component, a, b);
        } else {
            return Component(a);
        }
    }

})));