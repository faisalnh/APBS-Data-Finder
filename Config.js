const APP_CONFIG = Object.freeze({
  appName: 'APBS Data Finder',
  appVersion: '0.2.1',
  academicYear: '2026–2027',
  cache: Object.freeze({ version: 'v2', ttlSeconds: 120, maxChunkBytes: 85000 }),
  search: Object.freeze({ defaultLimit: 30, maximumLimit: 50 }),
  columns: Object.freeze({
    className: 1,
    unitContext: 2,
    budgetType: 3,
    category: 4,
    costCategory: 5,
    apbsName: 7,
    apbsNumber: 8,
    totalBudget: 93,
    remainingBudget: 96
  }),
  units: Object.freeze([
    { id: 'directorate', label: 'Directorate', sheetName: '1. DIRECTORATE', rowSpec: '84-88,105-107,132-145,147-151,175,181-183,189-194' },
    { id: 'care', label: 'CARE', sheetName: '2. CARE', rowSpec: '100-106,133-142,144-149,151,155-156,163-170,172-189,200-208' },
    { id: 'compass', label: 'COMPASS', sheetName: '3. COMPASS', rowSpec: '64,101-103,105-120,122-140,142-160,162,164-165,167-168' },
    { id: 'bridge', label: 'BRIDGE', sheetName: '4. BRIDGE', rowSpec: '100-101,103-109,160' },
    { id: 'mad-lab', label: 'MAD LAB', sheetName: '5. MAD LAB', rowSpec: '104,116-121,123-124,130-146,172-175' },
    {
      id: 'shield', label: 'SHIELD', sheetName: '6. SHIELD',
      rowSpec: '126-131,133-138,140-141,143-145,148-150,152-158,160-187,189-191,197-211,213-239,241-269,271-275,282-283,295-369,370-400,402-421,423-458,460-470,472-577,580-599,601-623,625-629,631-637',
      sections: [
        { label: 'TK', rowSpec: '197-211' }, { label: 'SD', rowSpec: '213-239' }, { label: 'SMP', rowSpec: '241-269' },
        { label: 'TK', rowSpec: '370-400' }, { label: 'SD', rowSpec: '402-421' }, { label: 'SMP', rowSpec: '423-458' }
      ]
    },
    { id: 'rise', label: 'RISE', sheetName: '7. RISE', rowSpec: '94-140,142-152,154-170' },
    { id: 'kindergarten', label: 'KINDERGARTEN', sheetName: '8. KINDERGARTEN', rowSpec: '91-93,95-100,102,104-106,108,110-112,114-115,117-118,120-122,124-128,130-133,135-139,142,144-146,148,150-154,156-161,162-163,166-170,172-175,178-179,181,183-184,186-189,191,196-197,199-209,215,221-222' },
    { id: 'elementary', label: 'ELEMENTARY', sheetName: '9. ELEMENTARY', rowSpec: '67-76,87-89,91-93,95-97,99-101,103-105,107-109,111-116,118-125,127,129,131,133,135,137,139-152,154-184,186-198,200-205,207-220,222-223,225-226,228-229,231-232,234-235,237-238,240,242-252,254-255,257-258,260,262-267,269-272,274-279,281-286,289,291-293,295,297-301,303-304,306-308,309-310,313-317,319-322,325-326,328,330-331,333-336,338,343-344,346-356,362,368-369,390-393,395-410,412-413,440-443,445-447,449,451-452,454-455,457-458' },
    // The supplied range "372-273" was corrected to "372-373" after validating the source workbook.
    { id: 'junior-high', label: 'JUNIOR HIGH', sheetName: '10. JUNIOR HIGH', rowSpec: '79-87,99,101,103,105-126,128,130,132,134,136-197,199-201,203-240,242-252,254,256-263,265,267,269,271-275,277-292,294-299,301-307,309-311,313-315,317-319,321-328,331,333-335,337,339-343,345-346,348-350,351-352,355-359,361-364,367-368,370,372-373,375-378,380,385-386,388-398,404,410-411,432-434,436-439,441-442,446-449,451-452,479-483,485-489,491-493' }
  ])
});

function parseRowSpec_(rowSpec) {
  const rows = new Set();
  String(rowSpec || '').split(',').map(token => token.trim()).filter(Boolean).forEach(token => {
    const match = token.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`Invalid row token: ${token}`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start) throw new Error(`Invalid row range: ${token}`);
    for (let row = start; row <= end; row += 1) rows.add(row);
  });
  return [...rows].sort((a, b) => a - b);
}

function getUnitConfig_(unitId) {
  return APP_CONFIG.units.find(unit => unit.id === unitId) || null;
}

function getConfiguredSection_(unitConfig, row) {
  return (unitConfig.sections || []).find(section => parseRowSpec_(section.rowSpec).includes(row)) || null;
}
