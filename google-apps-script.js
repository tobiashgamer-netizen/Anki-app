// ===== KOPIER DENNE KODE TIL DIT GOOGLE APPS SCRIPT =====
// (Udvidelser → Apps Script → erstat alt → Gem → Deploy igen)
//
// Google Sheet "Kort" kolonner:
// A=date, B=question, C=imageURL, D=answer, E=category, F=owner, G=public, H=likes, I=deckname, J=verified

const SHEET_NAME = "Kort";

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "getCards";

  if (action === "getCards") return getCards(e.parameter);
  if (action === "getBroadcast") return getBroadcast();
  if (action === "getActivity") return getActivity();
  if (action === "getBlindSpot") return getBlindSpot();

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
    if (action === "resolveError") return resolveError(data);
    if (action === "verifyCard") return verifyCard(data);
    if (action === "saveBroadcast") return saveBroadcast(data);
    if (action === "logActivity") return logActivity(data);
    if (action === "logAnalytics") return logAnalytics(data);

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

    sheet.appendRow([now, question, imageURL, answer, category, user, isPublic ? "true" : "false", 0, deckname, ""]);

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
        verified: String(row[9]).toLowerCase() === "true",
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
        newDeckname,         // deck name
        ""                   // verified
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

// Resolve an error report: update Reports sheet status and optionally update the card
function resolveError(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reportSheet = ss.getSheetByName("Reports");
  if (!reportSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "No Reports sheet" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var question = data.question || "";
  var newQuestion = data.newQuestion;
  var newAnswer = data.newAnswer;

  // Mark all open reports for this question as resolved
  var reports = reportSheet.getDataRange().getValues();
  for (var r = 1; r < reports.length; r++) {
    if (String(reports[r][1]) === question && String(reports[r][4]).toLowerCase() === "open") {
      reportSheet.getRange(r + 1, 5).setValue("resolved");
    }
  }

  // Optionally update the card in Kort sheet
  if (newQuestion !== undefined || newAnswer !== undefined) {
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      var allData = sheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (String(allData[i][1]) === question) {
          if (newQuestion !== undefined) sheet.getRange(i + 1, 2).setValue(newQuestion);
          if (newAnswer !== undefined) sheet.getRange(i + 1, 4).setValue(newAnswer);
          break;
        }
      }
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Toggle verified status on a card
function verifyCard(data) {
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

  var verified = data.verified ? "true" : "false";
  sheet.getRange(rowNum, 10).setValue(verified);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Save broadcast message
function saveBroadcast(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bSheet = ss.getSheetByName("Broadcast");
  if (!bSheet) {
    bSheet = ss.insertSheet("Broadcast");
    bSheet.appendRow(["Dato", "Besked"]);
  }
  var message = data.message || "";
  // Clear old messages and set new one
  if (bSheet.getLastRow() > 1) {
    bSheet.deleteRows(2, bSheet.getLastRow() - 1);
  }
  if (message) {
    bSheet.appendRow([new Date(), message]);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get current broadcast message
function getBroadcast() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bSheet = ss.getSheetByName("Broadcast");
  if (!bSheet || bSheet.getLastRow() < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ message: "" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var lastRow = bSheet.getLastRow();
  var message = bSheet.getRange(lastRow, 2).getValue() || "";
  return ContentService
    .createTextOutput(JSON.stringify({ message: String(message) }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Log user activity (last seen)
function logActivity(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aSheet = ss.getSheetByName("Activity");
  if (!aSheet) {
    aSheet = ss.insertSheet("Activity");
    aSheet.appendRow(["Bruger", "Sidst set"]);
  }
  var user = data.user || "";
  if (!user) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var allData = aSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === user) {
      aSheet.getRange(i + 1, 2).setValue(new Date());
      found = true;
      break;
    }
  }
  if (!found) {
    aSheet.appendRow([user, new Date()]);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get all activity records
function getActivity() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aSheet = ss.getSheetByName("Activity");
  if (!aSheet || aSheet.getLastRow() < 2) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = aSheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({ user: String(data[i][0] || ""), lastSeen: String(data[i][1] || "") });
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Log analytics ("Sv\u00e6rt" registrations)
function logAnalytics(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var anSheet = ss.getSheetByName("Analytics");
  if (!anSheet) {
    anSheet = ss.insertSheet("Analytics");
    anSheet.appendRow(["Dato", "Bruger", "Sp\u00f8rgsm\u00e5l", "Kvalitet"]);
  }
  anSheet.appendRow([new Date(), data.user || "", data.question || "", data.quality !== undefined ? data.quality : ""]);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get "blind spot" – top 10 most difficult cards
function getBlindSpot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var anSheet = ss.getSheetByName("Analytics");
  if (!anSheet || anSheet.getLastRow() < 2) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = anSheet.getDataRange().getValues();
  var countMap = {};
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][3]) === 0) { // quality 0 = Sv\u00e6rt
      var q = String(data[i][2] || "");
      countMap[q] = (countMap[q] || 0) + 1;
    }
  }
  var sorted = Object.keys(countMap).map(function(q) {
    return { question: q, count: countMap[q] };
  }).sort(function(a, b) { return b.count - a.count; }).slice(0, 10);

  return ContentService
    .createTextOutput(JSON.stringify(sorted))
    .setMimeType(ContentService.MimeType.JSON);
}
