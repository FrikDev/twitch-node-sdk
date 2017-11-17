/**
 * Implements login popups for Twitch
 * @module twitch-sdk
 * @submodule gui
 */

const URL = require('url');

const util = require('./twitch.util');
const core = require('./twitch.core');
const auth = require('./twitch.auth');

var WIDTH = 660;
var HEIGHT = 600;

var gui_type = null;
var nwGUI = null;

var gui = {};

gui.popupNWLogin = function(params) {
  var url = `${core.config.REDIRECT_URL}oauth2/authorize?${util.param(params)}`;

  var win = nwGUI.Window.open(url, {
    title: 'Login with TwitchTV',
    width: WIDTH,
    height: HEIGHT,
    toolbar: false,
    show: false,
    resizable: true
  });

  win.on('loaded', function() {
    var w = win.window;
    if (w.location.hostname == 'api.twitch.tv' && w.location.pathname == '/kraken/') {
      core.setSession(util.parseFragment(w.location.hash));

      auth.getStatus(function(err, status) {
        if (status.authenticated) {
          core.events.emit('auth.login', status);
        }
      });

      win.close();
    } else {
      win.show();
      win.focus();
    }
  });
}

gui.popupNW13Login = function(params) {
  var url = `${core.config.REDIRECT_URL}oauth2/authorize?${util.param(params)}`;

  nw.Window.open(url, {
    title: 'Login with TwitchTV',
    width: WIDTH,
    height: HEIGHT,
    id: 'login',
    resizable: true
  }, function(login) {
    login.on('loaded', function() {
      var w = this.window;
      if (w.location.hostname == 'api.twitch.tv' && w.location.pathname == '/kraken/') {
        core.setSession(util.parseFragment(w.location.hash));

        auth.getStatus(function(err, status) {
          if (status.authenticated) {
            core.events.emit('auth.login', status);
          }
        });

        this.close();
      } else {
        this.show();
        this.focus();
      }
    });
  });
}

gui.popupElectronLogin = function(params) {
  if (require('electron').remote) {
    BrowserWindow = require('electron').remote.BrowserWindow;
  } else {
    BrowserWindow = require('electron').BrowserWindow;
  }

  var url = `${core.config.REDIRECT_URL}oauth2/authorize?${util.param(params)}`;

  var win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadURL(url);
  win.webContents.on('did-finish-load', function() {
    var location = URL.parse(win.webContents.getURL());

    if (location.hostname == 'api.twitch.tv' && location.pathname == '/kraken/') {
      core.setSession(util.parseFragment(location.hash));

      auth.getStatus(function(err, status) {
        if (status.authenticated) {
          core.events.emit('auth.login', status);
        }
      });

      win.close();
    } else {
      win.show();
    }
  });
}

gui.setGUIType = function(name, nwg) {
  gui_type = name;

  if (gui_type == 'nw') {
    if (nwg) {
      nwGUI = nwg;
    } else {
      throw new Error('Did not get nw.gui object with GUI type "nw"');
    }
  }
}

gui.isActive = function() {
  return (gui_type !== null);
}

gui.popupLogin = function(params) {
  switch (gui_type) {
    case 'nw':
      popupNWLogin(params);
      break;
    case 'nw13':
      popupNW13Login(params);
      break;
    case 'electron':
      popupElectronLogin(params);
      break;
    default:
      throw new Error('The Twitch SDK was not initialized with any compatible GUI API.');
      break;
  }
};

module.exports = gui;
