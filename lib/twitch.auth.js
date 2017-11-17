/**
 * Addresses user authentication
 * @module twitch-sdk
 * @submodule auth
 */

const core = require('./twitch.core');
const gui = require('./twitch.gui');

// Key of the sessionStorage object or cookie.
var SESSION_KEY = 'twitch_oauth_session';

/**
 * Updates session info from the API.
 *
 * @private @method updateSession
 */
function updateSession(callback) {
  core.api({
    method: ''
  }, function(err, response) {
    var session;
    if (err) {
      core.log('error encountered updating session:', err);
      callback && callback(err, null)
      return;
    }

    if (!response.token.valid) {
      exports.logout(callback);
      return;
    }

    callback && callback(null, session);
  });
};

function makeSession(session) {
  return {
    authenticated: !!session.token,
    token: session.token,
    scope: session.scope,
    error: session.error,
    errorDescription: session.errorDescription
  };
}

exports.getToken = function() {
  return core.session && core.session.token;
};

exports.getStatus = function(options, callback) {
  core.log(options, callback);
  if (typeof options === 'function') {
      callback = options;
  }
  if (typeof callback !== 'function') {
      callback = function() {};
  }
  if (!core.session) {
    throw new Error('You must call init() before getStatus()');
  }

  if (options && options.force) {
    updateSession(function(err, session) {
      callback(err, makeSession(session || core.session));
    });
  } else {
    callback(null, makeSession(core.session));
  }
};

exports.login = function(options) {
  if (!gui.isActive()) {
    throw new Error('Cannot login without a GUI.');
  }

  if (!options.scope) {
    throw new Error('Must specify list of request scopes');
  }

  var params = {
    response_type: 'token',
    client_id: core.clientId,
    redirect_uri: core.config.REDIRECT_URL,
    scope: options.scope.join(' ')
  };

  if (options.force_verify) {
    params.force_verify = true;
  }

  if (!params.client_id) {
    throw new Error('You must call init() before login()');
  }

  gui.popupLogin(params);
};

exports.logout = function(callback) {
  core.setSession({});

  core.events.emit('auth.logout');
  if (typeof callback === 'function') {
    callback(null);
  }
};

exports.initSession = function(storedSession, callback) {
  core.log(storedSession, callback)
  if (typeof storedSession === "function") {
    callback = storedSession;
  }

  core.setSession((storedSession && makeSession(storedSession)) || {});

  exports.getStatus({
    force: true
  }, function(err, status) {
    if (status.authenticated) {
      core.events.emit('auth.login', status);
    }

    if (typeof callback === "function") {
      callback(err, status);
    }
  });
}
