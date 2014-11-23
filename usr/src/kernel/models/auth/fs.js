var fs = require('fs');
var pass = require('pwd');

module.exports = function(app) {
  var model = {};
  var storage = app.get('storage');
  
  model.readPasswd = function(cb) {
    fs.readFile(app.get('passwd'), 'utf8', function (err, data) {
      cb(err, err ? null : JSON.parse(data));
    });
  };

  model.init = function() {
    storage.setItem('oauth.accessTokens', []);
    storage.setItem('oauth.refreshTokens', []);
    storage.setItem('oauth.clients', [
        {
          clientId : 'test',
          clientSecret : 'password',
          redirectUri : ''
        }
    ]);

    storage.setItem('oauth.authorizedClientIds', {
        password: [
          'test'
        ],
        refresh_token: [
          'test'
        ],
        authorization_code: [
          'test'
        ]
      });

   storage.setItem('oauth.users', [
        {
          id : '123',
          username: 'testUser',
          password: 'testPassword'
        }
   ]);

   return model;
  };
  
  // Debug function to dump the state of the data stores
  model.dump = function() {
    console.log('oauth.accessTokens', storage.getItem('oauth.accessTokens'));
    console.log('oauth.clients', storage.getItem('oauth.clients'));
    console.log('oauth.authorizedClientIds', storage.getItem('oauth.authorizedClientIds'));
    console.log('oauth.refreshTokens', storage.getItem('oauth.refreshTokens'));
    console.log('oauth.users', storage.getItem('oauth.users'));
  };
  
  /*
   * Required
   */
  
  model.getAuthCode = function (authCode, callback) {
  };
  
  model.saveAuthCode = function (authCode, clientId, expires, user, callback) {
  };
  
  model.getAccessToken = function (bearerToken, callback) {
    var oauthAccessTokens = storage.getItem('oauth.accessTokens');

    for(var i = 0, len = oauthAccessTokens.length; i < len; i++) {
      var elem = oauthAccessTokens[i];
      if(elem.accessToken === bearerToken) {
        return callback(false, elem);
      }
    }
    callback(false, false);
  };
  
  model.getRefreshToken = function (bearerToken, callback) {
    var oauthRefreshTokens = storage.getItem('oauth.refreshTokens');

    for(var i = 0, len = oauthRefreshTokens.length; i < len; i++) {
      var elem = oauthRefreshTokens[i];
      if(elem.refreshToken === bearerToken) {
        return callback(false, elem);
      }
    }
    callback(false, false);
  };
  
  model.getClient = function (clientId, clientSecret, callback) {
    var oauthClients = storage.getItem('oauth.clients');

    for(var i = 0, len = oauthClients.length; i < len; i++) {
      var elem = oauthClients[i];
      if(elem.clientId === clientId &&
        (clientSecret === null || elem.clientSecret === clientSecret)) {
        return callback(false, elem);
      }
    }
    callback(false, false);
  };
  
  model.grantTypeAllowed = function (clientId, grantType, callback) {
    var authorizedClientIds = storage.getItem('oauth.authorizedClientIds');

    callback(false, authorizedClientIds[grantType] &&
      authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0);
  };
  
  model.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
    var oauthAccessTokens = storage.getItem('oauth.accessTokens');

    oauthAccessTokens.unshift({
      accessToken: accessToken,
      clientId: clientId,
      userId: userId,
      expires: expires
    });
  
    storage.setItem('oauth.accessTokens', oauthAccessTokens);

    callback(false);
  };
  
  model.saveRefreshToken = function (refreshToken, clientId, expires, userId, callback) {
    var oauthRefreshTokens = storage.getItem('oauth.refreshTokens');

    oauthRefreshTokens.unshift({
      refreshToken: refreshToken,
      clientId: clientId,
      userId: userId,
      expires: expires
    });

    storage.setItem('oauth.refreshTokens', oauthRefreshTokens);
  
    callback(false);
  };
  
  /*
   * Required to support password grant type
   */
  model.getUser = function (username, password, callback) {
    this.readPasswd(function(err, passwd) {
      if (err) {
        callback(false, false);
      }

      for(var i = 0, len = passwd.length; i < len; i++) {
        var elem = passwd[i];
        if(elem.username === username) {
          pass.hash(password, elem.password.salt, function(err, hash) {
            if (elem.password.hash == hash) {
              return callback(false, elem);
            }
            
            callback(false, false);
          });
          
          return;
        }
      }
  
      callback(false, false);
    });
  };
  
  return model.init();
}
