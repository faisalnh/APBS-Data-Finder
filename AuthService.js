function getCurrentUser_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Kami tidak dapat mengenali akun Google Anda. Silakan gunakan akun Google Workspace yang diizinkan.');
  }
  return { email: email, role: 'tester', allowedUnitIds: ['*'] };
}

function getUserAccess_(email) {
  // Version 1 deliberately grants all configured units to authenticated test users.
  // Replace this with an ACCESS sheet lookup before the role-based rollout.
  return { email: email, role: 'tester', allowedUnitIds: ['*'] };
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

function filterAllowedUnits_(requestedUnitIds, access) {
  const allowed = new Set(getAllowedUnitIds_(access));
  const requested = Array.isArray(requestedUnitIds) && requestedUnitIds.length
    ? requestedUnitIds.map(String)
    : [...allowed];
  return requested.filter(id => allowed.has(id));
}
