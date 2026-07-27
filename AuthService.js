const ADMIN_EMAILS = Object.freeze([
  'ian.ahmad@millennia21.id',
  'faisal@millennia21.id',
  'mahrukh@millennia21.id'
]);

const SHIELD_SECTION_ACCESS_BY_UNIT = Object.freeze({
  kindergarten: Object.freeze(['TK']),
  elementary: Object.freeze(['SD']),
  'junior-high': Object.freeze(['SMP'])
});

const UNIT_MEMBER_EMAILS = Object.freeze({
  directorate: Object.freeze([
    'derry@millennia21.id', 'muhammad.farhan@millennia21.id',
    'made@millennia21.id', 'kiki@millennia21.id', 'roma@millennia21.id'
  ]),
  care: Object.freeze([
    'adiya.herisa@millennia21.id', 'ismail@millennia21.id', 'rain@millennia21.id'
  ]),
  compass: Object.freeze([
    'susantika@millennia21.id', 'hanny@millennia21.id'
  ]),
  bridge: Object.freeze([
    'adibah.hana@millennia21.id', 'wina@millennia21.id', 'maulida.yunita@millennia21.id'
  ]),
  'mad-lab': Object.freeze([
    'ananta@millennia21.id', 'rizqi@millennia21.id'
  ]),
  shield: Object.freeze([
    'abdullah@millennia21.id', 'caesar@millennia21.id', 'dodi@millennia21.id', 'ardiansyah@millennia21.id',
    'denis@millennia21.id', 'dina@millennia21.id', 'dona@millennia21.id', 'gebby@millennia21.id',
    'irawan@millennia21.id', 'khairul@millennia21.id', 'sandi@millennia21.id', 'alfin@millennia21.id',
    'fathan.qalbi@millennia21.id', 'awal@millennia21.id', 'mukron@millennia21.id', 'radit@millennia21.id',
    'robby@millennia21.id', 'robiatul@millennia21.id', 'rohmatulloh@millennia21.id', 'udom@millennia21.id',
    'wahyu@millennia21.id', 'yeti@millennia21.id'
  ]),
  rise: Object.freeze([
    'jo@millennia21.id', 'hana.fajria@millennia21.id'
  ]),
  kindergarten: Object.freeze([
    'afiyanti.hardiansari@millennia21.id', 'anggie@millennia21.id', 'aprimaputri@millennia21.id',
    'diya@millennia21.id', 'hana.sajidah@millennia21.id', 'ikarahayu@millennia21.id', 'nanda@millennia21.id',
    'latifah@millennia21.id', 'widya@millennia21.id', 'ratna@millennia21.id', 'sindy@millennia21.id'
  ]),
  elementary: Object.freeze([
    'abu@millennia21.id', 'dhaffa@millennia21.id', 'almia@millennia21.id', 'annisa@millennia21.id',
    'aria@millennia21.id', 'alinsuwisto@millennia21.id', 'belakartika@millennia21.id', 'nana@millennia21.id',
    'devi.agriani@millennia21.id', 'devilarasati@millennia21.id', 'dien@millennia21.id', 'dinimeilani@millennia21.id',
    'akbarfadholi98@millennia21.id', 'ferdinand@millennia21.id', 'ferlyna.balqis@millennia21.id',
    'fransiskaeva@millennia21.id', 'fuadah@millennia21.id', 'gundah@millennia21.id', 'iis@millennia21.id',
    'kholida@millennia21.id', 'alys@millennia21.id', 'maria@millennia21.id', 'melvan@millennia21.id',
    'waly@millennia21.id', 'nadia.sakinah@millennia21.id', 'nathasya@millennia21.id', 'kusumawantari@millennia21.id',
    'novia@millennia21.id', 'pipiet@millennia21.id', 'cecil@millennia21.id', 'prisy@millennia21.id',
    'putri.fitriyani@millennia21.id', 'raisa@millennia21.id', 'rezarizky@millennia21.id', 'rike@millennia21.id',
    'tiana@millennia21.id', 'tiastiningrum@millennia21.id', 'triayulestari@millennia21.id',
    'tria@millennia21.id', 'yosafat@millennia21.id', 'zahra@millennia21.id', 'oudy@millennia21.id'
  ]),
  'junior-high': Object.freeze([
    'fikri.sadzili@millennia21.id', 'himawan@millennia21.id', 'ubaidillah@millennia21.id',
    'nadiamws@millennia21.id', 'sisil@millennia21.id', 'novan@millennia21.id', 'ifa@millennia21.id',
    'rifqi.satria@millennia21.id', 'rizkinurul@millennia21.id', 'vinka@millennia21.id', 'zolla@millennia21.id'
  ]),
  safe: Object.freeze([])
});

function getCurrentUser_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Kami tidak dapat mengenali akun Google Anda. Silakan gunakan akun Google Workspace yang diizinkan.');
  }
  return { email: email };
}

function getUserAccess_(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (ADMIN_EMAILS.includes(normalizedEmail)) {
    return {
      email: normalizedEmail,
      role: 'admin',
      assignedUnitId: 'all',
      assignedUnitLabel: 'Semua unit',
      allowedUnitIds: ['*'],
      shieldSections: ['*']
    };
  }

  const unitId = Object.keys(UNIT_MEMBER_EMAILS).find(id => UNIT_MEMBER_EMAILS[id].includes(normalizedEmail));
  if (!unitId) {
    throw new Error('Akun Google Anda tidak terdaftar sebagai staf yang memiliki akses APBS.');
  }

  const unit = getUnitConfig_(unitId);
  const shieldSections = SHIELD_SECTION_ACCESS_BY_UNIT[unitId] || [];
  return {
    email: normalizedEmail,
    role: 'unit-member',
    assignedUnitId: unitId,
    assignedUnitLabel: unit ? unit.label : unitId.toUpperCase(),
    allowedUnitIds: unit ? [unitId].concat(shieldSections.length ? ['shield'] : []) : [],
    shieldSections: shieldSections
  };
}

function assertAuthorizedUser_() {
  const user = getCurrentUser_();
  return getUserAccess_(user.email);
}

function getAllowedUnitIds_(access) {
  return access.allowedUnitIds.includes('*')
    ? APP_CONFIG.units.map(unit => unit.id)
    : access.allowedUnitIds.filter(id => Boolean(getUnitConfig_(id)));
}

function canAccessApbsRecord_(access, record) {
  if (access.role === 'admin' || record.unitId !== 'shield') return true;
  if (access.assignedUnitId === 'shield') return true;
  return access.shieldSections.includes(record.section);
}

function filterAllowedUnits_(requestedUnitIds, access) {
  const allowed = new Set(getAllowedUnitIds_(access));
  const requested = Array.isArray(requestedUnitIds) && requestedUnitIds.length
    ? requestedUnitIds.map(String)
    : [...allowed];
  return requested.filter(id => allowed.has(id));
}
