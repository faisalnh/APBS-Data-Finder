function searchApbs(request) {
  const access = assertAuthorizedUser_();
  const input = request || {};
  const query = String(input.query || '').trim();
  const allowedUnitIds = filterAllowedUnits_(input.unitIds, access);
  const limit = Math.min(Math.max(Number(input.limit) || APP_CONFIG.search.defaultLimit, 1), APP_CONFIG.search.maximumLimit);

  if (!query) {
    return { ok: true, query: '', totalMatches: 0, returnedCount: 0, hasMore: false, updatedAt: new Date().toISOString(), results: [] };
  }
  if (!allowedUnitIds.length) throw new Error('Unit yang dipilih tidak tersedia untuk akun Anda.');

  const normalizedQuery = normalizeSearchText_(query);
  const normalizedNumber = normalizeApbsNumber_(query);
  const terms = tokenizeSearchQuery_(query);
  const results = allowedUnitIds.flatMap(unitId => getUnitRecords_(getUnitConfig_(unitId)).filter(record => canAccessApbsRecord_(access, record)).map(record => {
    const score = scoreApbsRecord_(record, normalizedQuery, normalizedNumber, terms);
    return score ? Object.assign({}, publicApbsRecord_(record), { _score: score }) : null;
  }).filter(Boolean));

  results.sort((left, right) => right._score - left._score || left.unitName.localeCompare(right.unitName) || left.name.localeCompare(right.name) || left.number.localeCompare(right.number));
  const totalMatches = results.length;
  return {
    ok: true,
    query: query,
    totalMatches: totalMatches,
    returnedCount: Math.min(totalMatches, limit),
    hasMore: totalMatches > limit,
    updatedAt: new Date().toISOString(),
    results: results.slice(0, limit).map(result => { delete result._score; return result; })
  };
}

function publicApbsRecord_(record) {
  return {
    id: record.id,
    unitId: record.unitId,
    unitName: record.unitName,
    row: record.row,
    name: record.name,
    number: record.number,
    contextLabels: record.contextLabels,
    heading: record.heading,
    totalBudget: record.totalBudget,
    remainingBudget: record.remainingBudget
  };
}

function scoreApbsRecord_(record, query, numberQuery, terms) {
  const name = record.normalizedName;
  const number = record.normalizedNumber;
  const context = normalizeSearchText_([record.unitName, record.heading].concat(record.contextLabels).join(' '));
  if (numberQuery && number === numberQuery) return 1000;
  if (numberQuery && number.startsWith(numberQuery)) return 900;
  if (numberQuery && number.includes(numberQuery)) return 800;
  if (name === query) return 700;
  if (name.startsWith(query)) return 600;
  if (terms.length && terms.every(term => name.includes(term))) return 500;
  if (name.includes(query)) return 400;
  if (context.includes(query)) return 250;
  return 0;
}

function normalizeSearchText_(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function normalizeApbsNumber_(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function tokenizeSearchQuery_(value) {
  return normalizeSearchText_(value).split(' ').filter(Boolean);
}
