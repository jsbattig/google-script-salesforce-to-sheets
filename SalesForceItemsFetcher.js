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

function getSetting(sheet, row) {
  return sheet.getRange(row, 2).getValue();
}

var SalesForceItemsFetcher = function(spreadsheetID, version) {
  this.spreadsheetID = spreadsheetID; 
  this.version = version;
 
  this.fetchItems = function() {  
    const CONFIG_PREFIX = "Config";
    
    var excludeAttributes = new SimpleMap.SimpleMap(false); 
    excludeAttributes.put(".*attributes\..*");
    var sfConnector = new SalesForceConnector (this.version);    
    var spreadsheet = SpreadsheetApp.openById(this.spreadsheetID);
  
    spreadsheet.getSheets().forEach(function (sheet) {    
      if (sheet.getName().indexOf(CONFIG_PREFIX) < 0)
        return;
      var clientID = getSetting(sheet, 1);
      var clientSecret = getSetting(sheet, 2);
      var username = getSetting(sheet, 3);
      var password = getSetting(sheet, 4);
      var securityToken = getSetting(sheet, 5);      
      var method = getSetting(sheet, 10);
      var params = "q=" + getSetting(sheet, 11);
      var itemsSheetName = sheet.getName().substring(CONFIG_PREFIX.length, 255);
    
      var itemsSheet = spreadsheet.getSheetByName(itemsSheetName);
      if (itemsSheet == null)
        return;          
      itemsSheet.clear();     
 
      var nextRow = 2;
      var columnCount = 0;
      var objectArrayToSheetTransformer = new gsSheetsHelper.ObjectArrayToSheetTransformer(itemsSheet);      
      objectArrayToSheetTransformer.setExcludeColumns(excludeAttributes);
      if (!sfConnector.login(clientID, clientSecret, username, password, securityToken))
        throw("Authentication failed");
      
      var requestResult = sfConnector.performRequest(method, "GET", params);
      while (true) {        
        var result = objectArrayToSheetTransformer.objectArrayToBuffer(requestResult.records, nextRow, columnCount);
        if (result.nextRow - nextRow > 0) {
          var targetBuffer = objectArrayToSheetTransformer.getTargetBuffer();
          itemsSheet.getRange(nextRow, 1, result.nextRow - nextRow, result.columnCount).setValues(targetBuffer);
          nextRow = result.nextRow;
          columnCount = result.columnCount;
        } else 
          break;
        if (requestResult.nextRecordsUrl == null)
          break;
        requestResult = sfConnector.nextPageRequest("GET", requestResult.nextRecordsUrl);
      }
    });
  }
}