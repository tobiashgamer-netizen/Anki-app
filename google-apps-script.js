// ===== KOPIER DENNE KODE TIL DIT GOOGLE APPS SCRIPT =====
// (Udvidelser → Apps Script → erstat alt → Gem → Deploy igen)
//
// Google Sheet "Kort" kolonner:
// A=date, B=question, C=answer, D=category, E=owner, F=public, G=likes, H=deckname

const SHEET_NAME = "Kort";

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "getCards";

  if (action === "getCards") {
    return getCards(e.parameter);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Scriptet er aktivt!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "addCard";

    if (action === "editCard") {
      return editCard(data);
    }
    if (action === "deleteCard") {
      return deleteCard(data);
    }

    // Default: addCard
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var now = new Date();
    var question = data.question || data.q || "";
    var answer = data.answer || data.a || "";
    var category = data.category || data.cat || "Andet";
    var user = data.user || data.owner || "";
    var isPublic = data.public !== undefined ? data.public : true;
    var deckname = data.deckname || "";

    sheet.appendRow([now, question, answer, category, user, isPublic ? "true" : "false", 0, deckname]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getCards(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  var cards = [];
  var filterUser = params && params.user ? params.user : null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1] || row[2]) {
      var card = {
        row: i + 1,
        question: row[1] || "",
        answer: row[2] || "",
        category: row[3] || "Andet",
        user: row[4] || "",
        public: String(row[5]).toLowerCase() === "true",
        likes: Number(row[6]) || 0,
        deckname: row[7] || ""
      };

      if (filterUser) {
        if (card.user === filterUser || card.public) {
          cards.push(card);
        }
      } else {
        cards.push(card);
      }
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(cards))
    .setMimeType(ContentService.MimeType.JSON);
}

function editCard(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rowNum = data.row;
  if (!rowNum || rowNum < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Invalid row" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Verify ownership
  var currentOwner = sheet.getRange(rowNum, 5).getValue();
  if (data.user && currentOwner !== data.user) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Not authorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (data.question !== undefined) sheet.getRange(rowNum, 2).setValue(data.question);
  if (data.answer !== undefined) sheet.getRange(rowNum, 3).setValue(data.answer);
  if (data.category !== undefined) sheet.getRange(rowNum, 4).setValue(data.category);
  if (data.public !== undefined) sheet.getRange(rowNum, 6).setValue(data.public ? "true" : "false");
  if (data.deckname !== undefined) sheet.getRange(rowNum, 8).setValue(data.deckname);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteCard(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rowNum = data.row;
  if (!rowNum || rowNum < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Invalid row" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var currentOwner = sheet.getRange(rowNum, 5).getValue();
  if (data.user && currentOwner !== data.user) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Not authorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.deleteRow(rowNum);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
