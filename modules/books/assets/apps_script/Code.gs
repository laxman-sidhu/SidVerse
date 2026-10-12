// SidBooks - the read and write bridge for the one-tab workbook. Paste into Apps Script, deploy as a web app, see docs/PROJECT.md section 5.

// Must match APPS_SCRIPT_TOKEN in js/config.js.
var SECRET = 'sidverse-books-u81apw9xjBIM2AGt8dlx_0mJvwEvCZpZSBsuzbiq8E_42_Rk';

// Opened by id, so the script works bound to the workbook or standalone.
var SHEET_ID = '1L-c3xiSpec_l2Vd8ctJGGsl_46mm3Z_XBuPwzf2FAJk';
var BOOKS_SHEET = 'Sidbooks';

// Status values written by the site. Reading treats only the readlist words as queued.
var STATUS_READ = 'Done';
var STATUS_READLIST = 'Readlist';
var READLIST_WORDS = ['readlist', 'read list', 'want to read', 'to read', 'queued', 'wishlist', 'tbr'];

// Header text -> field, compared lowercased with whitespace collapsed. The FIRST column naming a field wins.
var COLUMN_ALIASES = {
  title:    ['title', 'book', 'book name', 'name'],
  isbn:     ['isbn', 'isbn13', 'isbn 13', 'isbn-13', 'isbn10', 'isbn 10', 'isbn-10'],
  author:   ['author', 'authors', 'writer', 'written by'],
  cover:    ['thumbnail url', 'thumbnail', 'link', 'cover', 'cover link', 'image', 'poster link', 'cover url', 'url'],
  genre:    ['genre', 'genres', 'category'],
  versions: ['other versions', 'other version', 'other editions', 'editions'],
  version_count: ['count', 'versions count', 'edition count', 'editions count'],
  summary:  ['summary', 'description', 'about', 'blurb'],
  status:   ['status', 'shelf', 'state'],
  book_id:  ['book id', 'bookid', 'book_id', 'id', 'google id', 'olid'],
  year:     ['year', 'published', 'publish year', 'first published'],
  date_read: ['date read', 'read on', 'finished', 'date']
};

// ============================================================================
// ENTRY POINTS
// ============================================================================

// Reading needs no token: the same rows are public through the published sheet.
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'read';
    if (action === 'ping') return reply(ping());
    return reply({ ok: true, tabs: { books: readTab(BOOKS_SHEET) } });
  } catch (error) {
    return reply({ ok: false, error: String(error && error.message || error) });
  }
}

// The body arrives as text/plain because Apps Script cannot answer a CORS preflight.
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (String(body.token || '') !== SECRET) return reply({ ok: false, error: 'Not authorised.' });

    var payload = body.payload || {};
    var actions = {
      mark_read: markRead,
      remove_read: removeRead,
      add_readlist: addReadlist,
      remove_readlist: removeReadlist,
      add_version: addVersion
    };

    var handler = actions[body.action];
    if (!handler) return reply({ ok: false, error: 'Unknown action: ' + body.action });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { return reply(handler(payload)); }
    finally { lock.releaseLock(); }
  } catch (error) {
    return reply({ ok: false, error: String(error && error.message || error) });
  }
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// SHEET PLUMBING
// ============================================================================

function workbook() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function readTab(name) {
  var sheet = workbook().getSheetByName(name);
  if (!sheet) return { header: [], rows: [] };
  var values = sheet.getDataRange().getDisplayValues();
  if (!values.length) return { header: [], rows: [] };
  return { header: values[0], rows: values.slice(1) };
}

function normaliseHeader(text) {
  return String(text == null ? '' : text).replace(/﻿/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getSheet() {
  var sheet = workbook().getSheetByName(BOOKS_SHEET);
  if (!sheet) throw new Error('No tab named "' + BOOKS_SHEET + '" in this workbook.');
  return sheet;
}

// Canonical field -> 1-based column index.
function columnMap(sheet) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < header.length; i++) {
    var normalised = normaliseHeader(header[i]);
    if (!normalised) continue;
    for (var field in COLUMN_ALIASES) {
      if (map[field] !== undefined) continue;
      if (COLUMN_ALIASES[field].indexOf(normalised) !== -1) { map[field] = i + 1; break; }
    }
  }
  return map;
}

function requireColumn(map, field, sheet) {
  if (map[field] === undefined) throw new Error('The "' + sheet.getName() + '" tab has no column for ' + field + '.');
  return map[field];
}

// The same shape js/core/util.js makes: lowercase, unaccented, punctuation-free.
var STRIP = (function () {
  try { return new RegExp('[^\\p{L}\\p{N}\\p{M}\\s]', 'gu'); }
  catch (e) { return /[^A-Za-z0-9\s]/g; }
})();

function normaliseTitle(text) {
  return String(text == null ? '' : text)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(STRIP, ' ').replace(/\s+/g, ' ').trim();
}

function normaliseAuthorText(text) {
  return normaliseTitle(text).replace(/\s+/g, '');
}

// A leading article is not part of a title; js/data/identity.js holds the same rule.
function filingTitle(text) {
  return normaliseTitle(text).replace(/^(?:the|a|an)\s+/, '');
}

// Both ISBN forms convert to 13 before comparison, exactly as identity.js does.
function normaliseIsbn(value) {
  var bare = String(value == null ? '' : value).replace(/[^0-9Xx]/g, '').toUpperCase();
  if (bare.length === 13) return bare;
  if (bare.length !== 10) return '';
  var body = '978' + bare.slice(0, 9);
  var sum = 0;
  for (var i = 0; i < 12; i++) sum += Number(body.charAt(i)) * (i % 2 ? 3 : 1);
  return body + String((10 - (sum % 10)) % 10);
}

function isReadlist(status) {
  return READLIST_WORDS.indexOf(String(status || '').trim().toLowerCase()) !== -1;
}

// ============================================================================
// FINDING A ROW
// ============================================================================

// Every matching row on one shelf ("read", "readlist" or "any"), not just the first.
function findRows(sheet, map, payload, shelf) {
  var last = sheet.getLastRow();
  if (last < 2) return [];

  var values = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getDisplayValues();
  var wantId = String(payload.book_id || '').trim();
  var wantIsbn = normaliseIsbn(payload.isbn);
  var wantTitle = filingTitle(payload.title);
  var wantAuthor = normaliseAuthorText(payload.author);

  var hits = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var cell = function (field) {
      var at = map[field];
      return at === undefined ? '' : String(row[at - 1] == null ? '' : row[at - 1]).trim();
    };

    var queued = isReadlist(cell('status'));
    if (shelf === 'read' && queued) continue;
    if (shelf === 'readlist' && !queued) continue;

    var matched = false;
    var rowIsbn = normaliseIsbn(cell('isbn'));
    if (wantIsbn && rowIsbn) {
      matched = wantIsbn === rowIsbn;
    } else if (wantId && cell('book_id') && cell('book_id') === wantId) {
      matched = true;
    } else if (wantTitle && filingTitle(cell('title')) === wantTitle) {
      var rowAuthor = normaliseAuthorText(cell('author'));
      matched = !wantAuthor || !rowAuthor || rowAuthor === wantAuthor;
    }
    if (matched) hits.push(i + 2);
  }
  return hits;
}

function deleteRows(sheet, rows) {
  var sorted = rows.slice().sort(function (a, b) { return b - a; });
  for (var i = 0; i < sorted.length; i++) sheet.deleteRow(sorted[i]);
  return sorted.length;
}

// Append one row, writing each field into the column its header names.
function appendRow(sheet, map, fields) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var row = new Array(width).fill('');
  for (var field in fields) {
    var at = map[field];
    if (at !== undefined && at <= width) row[at - 1] = fields[field];
  }
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function setCell(sheet, map, row, field, value) {
  if (map[field] !== undefined) sheet.getRange(row, map[field]).setValue(value);
}

function rowFields(payload, status) {
  return {
    title: payload.title,
    isbn: payload.isbn,
    author: payload.author,
    cover: payload.cover,
    genre: payload.genre,
    versions: payload.versions,
    version_count: payload.version_count,
    summary: payload.summary,
    status: status,
    book_id: payload.book_id,
    year: payload.year
  };
}

// ============================================================================
// ACTIONS
// ============================================================================

function ping() {
  var sheet = getSheet();
  var map = columnMap(sheet);
  var found = [];
  for (var field in map) found.push(field);
  return {
    ok: true,
    bridge: {
      rows: Math.max(sheet.getLastRow() - 1, 0),
      columns_found: found,
      secret_is_placeholder: SECRET.indexOf('change-this') !== -1
    }
  };
}

// A queued row is moved to the shelf in place, so a book is never in both lists.
function markRead(payload) {
  var sheet = getSheet();
  var map = columnMap(sheet);
  requireColumn(map, 'title', sheet);
  requireColumn(map, 'status', sheet);

  if (findRows(sheet, map, payload, 'read').length) return { ok: false, error: 'That book is already on the shelf.' };

  var queued = findRows(sheet, map, payload, 'readlist');
  if (queued.length) {
    for (var i = 0; i < queued.length; i++) {
      setCell(sheet, map, queued[i], 'status', STATUS_READ);
      setCell(sheet, map, queued[i], 'date_read', new Date().toISOString().slice(0, 10));
    }
    if (queued.length > 1) deleteRows(sheet, queued.slice(1));
    return { ok: true, row: queued[0], removed_from_readlist: true };
  }

  var fields = rowFields(payload, STATUS_READ);
  fields.date_read = new Date().toISOString().slice(0, 10);
  return { ok: true, row: appendRow(sheet, map, fields), removed_from_readlist: false };
}

// One more printing filed against a book already read; every row for that book gets the line.
function addVersion(payload) {
  var sheet = getSheet();
  var map = columnMap(sheet);
  requireColumn(map, 'versions', sheet);

  var isbn = normaliseIsbn(payload.edition_isbn);
  var line = String(payload.line || '').trim();
  if (!isbn || !line) return { ok: false, error: 'That edition has no ISBN to file.' };
  if (normaliseIsbn(payload.isbn) === isbn) return { ok: false, error: 'That is the printing already on the shelf.' };

  var rows = findRows(sheet, map, payload, 'read');
  if (!rows.length) return { ok: false, error: 'No row matched that book.' };

  var updated = 0;
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var cell = sheet.getRange(rows[i], map.versions);
    var lines = versionLines(cell.getValue());
    count = lines.length;
    if (listsIsbn(lines, isbn)) continue;
    lines.push(line);
    cell.setValue(lines.join('\n'));
    if (map.version_count !== undefined) sheet.getRange(rows[i], map.version_count).setValue(lines.length);
    count = lines.length;
    updated++;
  }

  if (!updated) return { ok: false, error: 'That edition is already filed under this book.' };
  return { ok: true, updated: updated, count: count };
}

// "None" means the lookup ran and found nothing, so it is not a line.
function versionLines(value) {
  var text = String(value == null ? '' : value).trim();
  if (!text || text.toLowerCase() === 'none') return [];
  return text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
}

// Only the ISBN is read off a line; the rest is for a human.
function listsIsbn(lines, isbn) {
  for (var i = 0; i < lines.length; i++) {
    if (normaliseIsbn(lines[i].split(/[\s·|,;]+/)[0]) === isbn) return true;
  }
  return false;
}

function removeRead(payload) {
  var sheet = getSheet();
  var rows = findRows(sheet, columnMap(sheet), payload, 'read');
  if (!rows.length) return { ok: false, error: 'No row matched that book.' };
  return { ok: true, removed: deleteRows(sheet, rows) };
}

function addReadlist(payload) {
  var sheet = getSheet();
  var map = columnMap(sheet);
  requireColumn(map, 'title', sheet);
  requireColumn(map, 'status', sheet);

  if (findRows(sheet, map, payload, 'readlist').length) return { ok: false, error: 'That book is already on the readlist.' };
  if (findRows(sheet, map, payload, 'read').length) return { ok: false, error: 'That one has already been read.' };

  return { ok: true, row: appendRow(sheet, map, rowFields(payload, STATUS_READLIST)) };
}

function removeReadlist(payload) {
  var sheet = getSheet();
  var rows = findRows(sheet, columnMap(sheet), payload, 'readlist');
  if (!rows.length) return { ok: false, error: 'No row matched that book.' };
  return { ok: true, removed: deleteRows(sheet, rows) };
}

// ============================================================================
// RUN THESE BY HAND
// ============================================================================

// Select this in the toolbar and press Run. It reports and changes nothing.
function testSetup() {
  var report = ping();
  Logger.log('Sidbooks rows:  ' + report.bridge.rows);
  Logger.log('Columns found:  ' + report.bridge.columns_found.join(', '));

  var needed = ['title', 'isbn', 'author', 'cover', 'genre', 'versions', 'version_count', 'summary', 'status'];
  for (var i = 0; i < needed.length; i++) {
    if (report.bridge.columns_found.indexOf(needed[i]) === -1) Logger.log('MISSING COLUMN: ' + needed[i]);
  }
  if (report.bridge.secret_is_placeholder) Logger.log('WARNING: SECRET is still the placeholder.');
  Logger.log('Remember: the site sees the last DEPLOYED version, not the last saved one.');
}

// Removes a second read row for the same book, keeping the first. File > Version history undoes it.
function cleanDuplicates() {
  var sheet = getSheet();
  var map = columnMap(sheet);
  var last = sheet.getLastRow();
  if (last < 3) { Logger.log('Nothing to clean.'); return; }

  var values = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getDisplayValues();
  var seen = {};
  var doomed = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var at = function (field) {
      var col = map[field];
      return col === undefined ? '' : String(row[col - 1] == null ? '' : row[col - 1]).trim();
    };
    var key = (isReadlist(at('status')) ? 'q|' : 'r|') + filingTitle(at('title')) + '|' + normaliseAuthorText(at('author'));
    if (seen[key]) { doomed.push(i + 2); Logger.log('Duplicate: ' + at('title')); }
    else seen[key] = true;
  }

  deleteRows(sheet, doomed);
  Logger.log('Removed ' + doomed.length + ' duplicate row(s).');
}
