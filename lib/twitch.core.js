/**
 * Implements the `api` method for communication with the Twitch API servers
 * @module twitch-sdk
 * @submodule core
 */

const https = require('https');

const auth = require('./twitch.auth');
const util = require('./twitch.util');

const EventEmitter = require('events').EventEmitter;

var core = {};
var clientId = null;
var session = null;
var debug = false;
var HTTP_CODES = {
  unauthorized: 401
};

core.events = new EventEmitter();
core.config = {
  REDIRECT_URL: 'https://api.twitch.tv/kraken/',
  REDIRECT_HOST: 'api.twitch.tv',
  REDIRECT_PATH: '/kraken'
};
core.clientId = clientId;
core.session = session;

core.setClientId = function(client_id) {
  clientId = client_id;
}

core.setSession = function(new_session) {
  session = new_session;
}

core.api = function(options, callback) {
  if (!session) {
    throw Error('You must call init() before api()');
  }

  var version = options.version || 'v3';
  var params = options.params || {};
  callback = callback || function() {};
  var authenticated = !!session.token;
  var url = core.config.REDIRECT_PATH + (options.url || options.method || '');

  if (authenticated) {
    params.oauth_token = session.token;
  }

  var request_options = {
    host: core.config.REDIRECT_HOST,
    path: `${url}?${util.param(params)}`,
    method: options.verb || 'GET',
    headers: {
      Accept: `application/vnd.twitchtv.${version}+json`,
      'Client-ID': clientId
    }
  };

  var req = https.request(request_options, function (res) {
    core.log('Response status:'. res.statusCode, res.statusMessage);
    res.setEncoding('utf8');

    var responseBody = "";

    res.on('data', function (data) {
      responseBody += data;
    });

    res.on('end', function () {
      var data = JSON.parse(responseBody);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        core.log('Response Data:', data);
        callback(null, data || null);
      } else {
        if (authenticated && res.statusCode === HTTP_CODES.unauthorized) {
          auth.logout(function () {
            callback(data, null);
          });
        } else {
          callback(data, null);
        }
      }
    });
  });

  req.on('error', function (e) {
    console.log('API Erro:', e);
    callback(e, null);
  });

  req.end();
}

core.log = function () {
  Array.prototype.unshift.call(arguments, '[Twitch SDK]');
  if (debug) {
    console.log.apply(console, arguments);
  }
}

core.setDebug = function (mode) {
  debug = mode;
}

module.exports = core;
