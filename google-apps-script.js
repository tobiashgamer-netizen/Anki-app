// ===== KOPIER DENNE KODE TIL DIT GOOGLE APPS SCRIPT =====
// (Udvidelser → Apps Script → erstat alt → Gem → Deploy igen)

const SHEET_NAME = "Kort";

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "getCards";

  if (action === "getCards") {
    return getCards();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Scriptet er aktivt!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const now = new Date();
    const question = data.question || data.q || "";
    const answer = data.answer || data.a || "";
    const category = data.category || data.cat || "Andet";
    const user = data.user || "";

    sheet.appendRow([now, question, answer, category, user]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getCards() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const cards = [];

  // Skip header row (row 0), read data rows
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1] || row[2]) { // has question or answer
      cards.push({
        question: row[1] || "",
        answer: row[2] || "",
        category: row[3] || "Andet",
        user: row[4] || ""
      });
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(cards))
    .setMimeType(ContentService.MimeType.JSON);
}
