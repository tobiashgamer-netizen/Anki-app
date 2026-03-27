// ===== KOPIER DENNE KODE TIL DIT GOOGLE APPS SCRIPT =====
// (Udvidelser → Apps Script → erstat alt → Gem → Deploy igen)
//
// Google Sheet "Kort" kolonner:
// A=date, B=question, C=imageURL, D=answer, E=category, F=owner, G=public, H=likes, I=deckname

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

    if (action === "editCard") return editCard(data);
    if (action === "deleteCard") return deleteCard(data);
    if (action === "copyDeck") return copyDeck(data);
    if (action === "likeDeck") return likeDeck(data);
    if (action === "reportError") return reportError(data);

    // Default: addCard
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var now = new Date();
    var question = data.question || data.q || "";
    var imageURL = data.imageURL || "";
    var answer = data.answer || data.a || "";
    var category = data.category || data.cat || "Andet";
    var user = data.user || data.owner || "";
    var isPublic = data.public !== undefined ? data.public : true;
    var deckname = data.deckname || "";

    sheet.appendRow([now, question, imageURL, answer, category, user, isPublic ? "true" : "false", 0, deckname]);

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

  // Collect open error reports from Reports sheet
  var reportSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");
  var errorMap = {}; // question -> latest error message
  if (reportSheet) {
    var reports = reportSheet.getDataRange().getValues();
    for (var r = 1; r < reports.length; r++) {
      if (String(reports[r][4]).toLowerCase() === "open") {
        var q = String(reports[r][1] || "");
        errorMap[q] = String(reports[r][3] || "");
      }
    }
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1] || row[2]) {
      var card = {
        row: i + 1,
        question: row[1] || "",
        imageURL: row[2] || "",
        answer: row[3] || "",
        category: row[4] || "Andet",
        user: row[5] || "",
        public: String(row[6]).toLowerCase() === "true",
        likes: Number(row[7]) || 0,
        deckname: row[8] || "",
        error_report: errorMap[String(row[1] || "")] || null
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

  var currentOwner = sheet.getRange(rowNum, 6).getValue();
  if (data.user && currentOwner !== data.user) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Not authorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (data.question !== undefined) sheet.getRange(rowNum, 2).setValue(data.question);
  if (data.imageURL !== undefined) sheet.getRange(rowNum, 3).setValue(data.imageURL);
  if (data.answer !== undefined) sheet.getRange(rowNum, 4).setValue(data.answer);
  if (data.category !== undefined) sheet.getRange(rowNum, 5).setValue(data.category);
  if (data.public !== undefined) sheet.getRange(rowNum, 7).setValue(data.public ? "true" : "false");
  if (data.deckname !== undefined) sheet.getRange(rowNum, 9).setValue(data.deckname);

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

  var currentOwner = sheet.getRange(rowNum, 6).getValue();
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

// Copy an entire deck: duplicate all cards from deckname+owner to a new user as private
function copyDeck(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sourceDeck = data.deckname;
  var sourceOwner = data.sourceOwner;
  var newOwner = data.user;
  var newDeckname = data.newDeckname || sourceDeck;

  if (!sourceDeck || !sourceOwner || !newOwner) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Missing parameters" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var allData = sheet.getDataRange().getValues();
  var copied = 0;
  var now = new Date();

  for (var i = 1; i < allData.length; i++) {
    var row = allData[i];
    var rowDeck = String(row[8] || "");
    var rowOwner = String(row[5] || "");

    if (rowDeck === sourceDeck && rowOwner === sourceOwner) {
      sheet.appendRow([
        now,
        row[1] || "",      // question
        row[2] || "",      // imageURL
        row[3] || "",      // answer
        row[4] || "Andet", // category
        newOwner,           // new owner
        "false",            // private by default
        0,                  // likes reset
        newDeckname         // deck name
      ]);
      copied++;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, copied: copied }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Report an error on a card: append to a separate "Reports" sheet
function reportError(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reportSheet = ss.getSheetByName("Reports");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("Reports");
    reportSheet.appendRow(["Dato", "Spørgsmål", "Reporter", "Fejlbesked", "Status"]);
  }

  var question = data.question || "";
  var reporter = data.reporter || "";
  var message = data.message || "";

  if (!question || !message) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Missing question or message" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  reportSheet.appendRow([new Date(), question, reporter, message, "open"]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Like a deck: increment likes on all cards in the deck
function likeDeck(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var deckname = data.deckname;
  var deckOwner = data.deckOwner;

  if (!deckname || !deckOwner) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Missing parameters" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var allData = sheet.getDataRange().getValues();
  var updated = 0;

  for (var i = 1; i < allData.length; i++) {
    var row = allData[i];
    if (String(row[8] || "") === deckname && String(row[5] || "") === deckOwner) {
      var currentLikes = Number(row[7]) || 0;
      sheet.getRange(i + 1, 8).setValue(currentLikes + 1);
      updated++;
      break; // Only increment first row of deck (represents deck likes)
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, updated: updated }))
    .setMimeType(ContentService.MimeType.JSON);
}
