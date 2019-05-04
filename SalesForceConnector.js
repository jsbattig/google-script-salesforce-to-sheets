function buildBaseSettings(mode, access_token) {
  var settings = {
    "async": true,
    "crossDomain": true,
    "method": mode,
    "contentType": "application/json",
    "headers": {        
      "Cache-Control": "no-cache",
      "muteHttpExceptions" : true
    },
    "payload": null
  } 
  if (access_token != null)
    settings.headers.Authorization = "Bearer " + access_token;
  return settings;
}

function doRequest(url, settings) {
  var result = UrlFetchApp.fetch(url, settings);
  var json = result.getContentText();   
  result = JSON.parse(json);
  return result;
}

var SalesForceConnector = function(version) {
  this.access_token = "";
  this.instance_url = "";
  this.version = version;

  this.checkAccessToken = function() {
    if (this.access_token == "")
      throw ("Not authenticated");
  }  
  
  this.login = function(clientId, clientSecret, username, password, securityToken) {    
    var settings = buildBaseSettings("POST");
    var url = "https://login.salesforce.com/services/oauth2/token?grant_type=password&client_id=" + clientId + 
              "&client_secret=" + clientSecret + 
              "&username=" + username + 
              "&password=" + password + securityToken;
  
    var result = doRequest(url, settings);    
    this.access_token = result.access_token;
    this.instance_url = result.instance_url;
    
    return result.access_token != "";
  }
  
  this.performRequest = function(apiMethod, mode, params, payload) {
    this.checkAccessToken();
    
    var settings = buildBaseSettings(mode, this.access_token);    
    settings.payload = payload != null ? JSON.stringify(payload) : null;
    var url = this.instance_url + "/services/data/v" + this.version + "/" + apiMethod + "/?" + params;        
    var result = doRequest(url, settings);    
    
    return result;
  }

  this.nextPageRequest = function(mode, baseUrl) {
    this.checkAccessToken();   
  
    var settings = buildBaseSettings(mode, this.access_token);    
    var url = this.instance_url + baseUrl;    
    var result = doRequest(url, settings);    
    
    return result;
  }  
}