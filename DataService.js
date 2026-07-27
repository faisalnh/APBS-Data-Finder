function getUnitRecords_(unitConfig, forceRefresh) {
  if (!forceRefresh) {
    const cached = getCachedUnitRecords_(unitConfig.id);
    if (cached) return cached;
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Spreadsheet sumber tidak ditemukan. Pastikan script tetap terikat dengan dokumen RAPBS.');
  const sheet = spreadsheet.getSheetByName(unitConfig.sheetName);
  if (!sheet) throw new Error(`Tab sumber tidak ditemukan: ${unitConfig.sheetName}`);

  const rows = parseRowSpec_(unitConfig.rowSpec);
  const maxRow = Math.max(...rows);
  const context = sheet.getRange(1, 1, maxRow, 8).getDisplayValues();
  const totals = sheet.getRange(1, APP_CONFIG.columns.totalBudget, maxRow, 1).getValues();
  const remaining = sheet.getRange(1, APP_CONFIG.columns.remainingBudget, maxRow, 1).getValues();
  const configuredRows = new Set(rows);
  const records = rows.map(row => buildApbsRecord_(unitConfig, row, context, totals, remaining, configuredRows))
    .filter(isValidApbsRecord_);

  setCachedUnitRecords_(unitConfig.id, records);
  return records;
}

function buildApbsRecord_(unitConfig, row, contextRows, totals, remaining, configuredRows) {
  const values = contextRows[row - 1] || [];
  const name = cleanDisplayValue_(values[APP_CONFIG.columns.apbsName - 1]);
  const number = cleanDisplayValue_(values[APP_CONFIG.columns.apbsNumber - 1]);
  const section = getConfiguredSection_(unitConfig, row);
  const labels = buildContextLabels_(values, section && section.label);
  const heading = findNearestHeading_(contextRows, row, configuredRows);
  return {
    id: `${unitConfig.id}:${row}`,
    unitId: unitConfig.id,
    unitName: unitConfig.label,
    sheetName: unitConfig.sheetName,
    row: row,
    className: cleanDisplayValue_(values[0]),
    schoolLevel: cleanDisplayValue_(values[1]),
    budgetType: cleanDisplayValue_(values[2]),
    category: cleanDisplayValue_(values[3]),
    costCategory: cleanDisplayValue_(values[4]),
    section: section ? section.label : '',
    heading: heading,
    contextLabels: labels,
    name: name,
    number: number,
    totalBudget: normalizeBudgetValue_(totals[row - 1] && totals[row - 1][0]),
    remainingBudget: normalizeBudgetValue_(remaining[row - 1] && remaining[row - 1][0]),
    normalizedName: normalizeSearchText_(name),
    normalizedNumber: normalizeApbsNumber_(number)
  };
}

function isValidApbsRecord_(record) {
  return Boolean(record.name && /^\d{2}-\d+$/.test(record.number));
}

function buildContextLabels_(values, explicitSection) {
  const labels = [];
  const className = cleanDisplayValue_(values[0]);
  const schoolLevel = cleanDisplayValue_(values[1]);
  const category = cleanDisplayValue_(values[3]);
  const costCategory = cleanDisplayValue_(values[4]);
  if (className && !/^all$/i.test(className)) labels.push(`Kelas ${className}`);
  if (explicitSection && !labels.includes(explicitSection)) labels.push(explicitSection);
  if (schoolLevel && !labels.includes(schoolLevel)) labels.push(schoolLevel);
  if (category) labels.push(category);
  if (costCategory && !labels.includes(costCategory)) labels.push(costCategory);
  return [...new Set(labels)].slice(0, 4);
}

function findNearestHeading_(contextRows, row, configuredRows) {
  for (let candidate = row - 1; candidate >= Math.max(1, row - 20); candidate -= 1) {
    if (configuredRows.has(candidate)) continue;
    const values = contextRows[candidate - 1] || [];
    const name = cleanDisplayValue_(values[APP_CONFIG.columns.apbsName - 1]);
    const number = cleanDisplayValue_(values[APP_CONFIG.columns.apbsNumber - 1]);
    if (name && !number && !/^total|subtotal|grand total/i.test(name)) return name;
  }
  return '';
}

function cleanDisplayValue_(value) {
  const text = String(value || '').trim();
  return /^#(?:NAME|ERROR|REF|VALUE|N\/A)\!?$/i.test(text) ? '' : text;
}

function normalizeBudgetValue_(value) {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value === 'number' && isFinite(value)) return value;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return isFinite(parsed) ? parsed : null;
}

function getCachedUnitRecords_(unitId) {
  const cache = CacheService.getScriptCache();
  const manifest = cache.get(cacheKey_(unitId, 'manifest'));
  if (!manifest) return null;
  try {
    const meta = JSON.parse(manifest);
    const chunks = [];
    for (let index = 0; index < meta.chunks; index += 1) {
      const part = cache.get(cacheKey_(unitId, index));
      if (!part) return null;
      chunks.push(part);
    }
    return JSON.parse(chunks.join(''));
  } catch (error) {
    return null;
  }
}

function setCachedUnitRecords_(unitId, records) {
  const serialized = JSON.stringify(records);
  const size = APP_CONFIG.cache.maxChunkBytes;
  const chunks = [];
  for (let offset = 0; offset < serialized.length; offset += size) chunks.push(serialized.slice(offset, offset + size));
  const cache = CacheService.getScriptCache();
  const values = {};
  chunks.forEach((chunk, index) => { values[cacheKey_(unitId, index)] = chunk; });
  values[cacheKey_(unitId, 'manifest')] = JSON.stringify({ chunks: chunks.length });
  cache.putAll(values, APP_CONFIG.cache.ttlSeconds);
}

function cacheKey_(unitId, suffix) {
  return `apbs:${APP_CONFIG.cache.version}:${unitId}:${suffix}`;
}

function clearApbsCache() {
  APP_CONFIG.units.forEach(unit => {
    const cache = CacheService.getScriptCache();
    const manifest = cache.get(cacheKey_(unit.id, 'manifest'));
    cache.remove(cacheKey_(unit.id, 'manifest'));
    if (manifest) {
      try {
        const meta = JSON.parse(manifest);
        for (let index = 0; index < meta.chunks; index += 1) cache.remove(cacheKey_(unit.id, index));
      } catch (error) {
        // A malformed manifest is already removed; the next read rebuilds this unit.
      }
    }
  });
}
