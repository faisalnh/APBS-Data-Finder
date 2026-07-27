function validateApbsConfiguration() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const errors = [];
  const warnings = [];
  const duplicateNumbers = {};
  const duplicateNames = {};
  let configuredRows = 0;
  let validRecords = 0;

  APP_CONFIG.units.forEach(unit => {
    const sheet = spreadsheet.getSheetByName(unit.sheetName);
    if (!sheet) {
      errors.push({ unitId: unit.id, type: 'MISSING_SHEET', value: unit.sheetName });
      return;
    }
    let rows;
    try { rows = parseRowSpec_(unit.rowSpec); }
    catch (error) { errors.push({ unitId: unit.id, type: 'INVALID_ROW_SPEC', value: error.message }); return; }
    configuredRows += rows.length;
    const records = getUnitRecords_(unit, true);
    validRecords += records.length;
    const configured = new Set(rows);
    const accepted = new Set(records.map(record => record.row));
    configured.forEach(row => {
      if (!accepted.has(row)) warnings.push({ unitId: unit.id, row: row, type: 'IGNORED_NON_APBS_ROW' });
    });
    records.forEach(record => {
      if (!duplicateNumbers[record.number]) duplicateNumbers[record.number] = [];
      if (!duplicateNames[record.normalizedName]) duplicateNames[record.normalizedName] = [];
      duplicateNumbers[record.number].push(record);
      duplicateNames[record.normalizedName].push(record);
    });
  });

  const duplicateNumberEntries = Object.keys(duplicateNumbers).filter(key => duplicateNumbers[key].length > 1)
    .map(key => ({ number: key, records: duplicateNumbers[key].map(publicApbsRecord_) }));
  duplicateNumberEntries.forEach(entry => errors.push({ type: 'DUPLICATE_APBS_NUMBER', value: entry.number }));
  const duplicateNameEntries = Object.keys(duplicateNames).filter(key => duplicateNames[key].length > 1)
    .map(key => ({ name: duplicateNames[key][0].name, count: duplicateNames[key].length }));

  return {
    valid: errors.length === 0,
    checkedAt: new Date().toISOString(),
    summary: { configuredRows: configuredRows, validRecords: validRecords, ignoredRows: configuredRows - validRecords, duplicateNumbers: duplicateNumberEntries.length, duplicateNames: duplicateNameEntries.length },
    errors: errors,
    warnings: warnings,
    duplicateNames: duplicateNameEntries
  };
}

function previewDuplicateApbsNames() {
  const index = {};
  APP_CONFIG.units.forEach(unit => getUnitRecords_(unit).forEach(record => {
    if (!index[record.normalizedName]) index[record.normalizedName] = [];
    index[record.normalizedName].push(publicApbsRecord_(record));
  }));
  return Object.keys(index).filter(key => index[key].length > 1)
    .map(key => ({ name: index[key][0].name, records: index[key] }))
    .sort((left, right) => right.records.length - left.records.length || left.name.localeCompare(right.name));
}
