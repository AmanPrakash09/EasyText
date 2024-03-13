const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		/* To be implemented */
	};

	this.deleteSession = (request) => {
		/* To be implemented */
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);

    this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        const token = crypto.randomBytes(16).toString('hex');

        const session = { username, createdAt: Date.now(), maxAge };

        sessions[token] = session;

        response.cookie('cpen322-session', token, { maxAge, httpOnly: true });

        setTimeout(() => {
            delete sessions[token];
        }, maxAge);

        return token;
    };
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;