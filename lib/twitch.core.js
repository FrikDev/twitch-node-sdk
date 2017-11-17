/**
 * Implements the `api` method for communication with the Twitch API servers
 * @module twitch-sdk
 * @submodule core
 */

const https = require('https');

const auth = require('./twitch.auth');
const util = require('./twitch.util');

const EventEmitter = require('events').EventEmitter;
const events = new EventEmitter();
exports.events = events;

var clientId = null;
var session = null;
var debug = false;
var HTTP_CODES = {
  unauthorized: 401
};
var config = {
  REDIRECT_URL: 'https://api.twitch.tv/kraken/',
  REDIRECT_HOST: 'api.twitch.tv',
  REDIRECT_PATH: '/kraken'
};

exports.config = config;

exports.clientId = clientId;
exports.session = session;

exports.setClientId = function(client_id) {
  exports.clientId = clientId = client_id;
}

exports.setSession = function(new_session) {
  exports.session = session = new_session;
};

exports.api = function(options, callback) {
  if (!session) {
    throw new Error('You must call init() before api()');
  }

  var version = options.version || 'v3';

  var params = options.params || {};

  callback = callback || function() {};

  var authenticated = !!session.token;
  var url = config.REDIRECT_PATH + (options.url || options.method || '');

  if (authenticated) {
    params.oauth_token = session.token;
  }

  var request_options = {
    host: config.REDIRECT_HOST,
    path: `${url}?${util.param(params)}`,
    method: options.verb || 'GET',
    headers: {
      'Accept': `application/vnd.twitchtv.${version}+json`,
      'Client-ID': clientId
    }
  };

  var req = https.request(request_options, function (res) {
    exports.log('Response status:', res.statusCode, res.statusMessage);
    res.setEncoding('utf8');

    var responseBody = "";

    res.on('data', function (data) {
      responseBody += data;
    });

    res.on('end', function () {
      var data = JSON.parse(responseBody);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        exports.log('Response Data:', data);
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
    exports.log('API Error:', e);
    callback(e, null);
  });

  req.end();
}

exports.setDebug = function (mode) {
  debug = mode;
  exports.log('Debug mode');
};

exports.log = function () {
  Array.prototype.unshift.call(arguments, '[Twitch]');
  if (debug) {
    console.log.apply(console, arguments);
  }
}
