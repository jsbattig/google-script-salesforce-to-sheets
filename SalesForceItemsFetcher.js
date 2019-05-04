function getSetting(sheet, row) {
  return sheet.getRange(row, 2).getValue();
}

var SalesForceItemsFetcher = function(spreadsheetID, version) {
  this.spreadsheetID = spreadsheetID; 
  this.version = version;
 
  this.fetchItems = function() {  
    const CONFIG_PREFIX = "Config";
    
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