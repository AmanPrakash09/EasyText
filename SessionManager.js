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
		const token = crypto.randomBytes(16).toString('hex');
        
        sessions[token] = {
            username: username,
            createdAt: Date.now(),
            expiresAt: Date.now() + maxAge
        };

        response.cookie('cpen322-session', token, {
            maxAge: maxAge,
            httpOnly: true
        });

        console.log(`Set-Cookie header: cpen322-session=${token}; Max-Age=${maxAge / 1000}; Path=/; HttpOnly; Secure; SameSite=Strict`);

        setTimeout(() => {
            console.log(`Deleting session for token: ${token}`);
            delete sessions[token];
        }, maxAge);

        return token;
	};

	this.deleteSession = (request) => {
		/* To be implemented */
	};

	this.middleware = (request, response, next) => {
		const cookieHeader = req.headers.cookie;
		if (!cookieHeader) {
			return next(new SessionManager.Error("No cookie found"));
		}
	
		const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split('=');
			acc[key] = value;
			return acc;
		}, {});
	
		const token = cookies['cpen322-session'];
		if (!token || !(token in this.sessions)) {
			return next(new SessionManager.Error("Invalid session token"));
		}
	
		req.username = this.sessions[token].username;
		req.session = token;
		next();
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);

};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;