/* 
MIT License

Copyright (c) 2019 Jose Sebastian Battig

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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