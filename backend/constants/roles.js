const USER_ROLES = ['Admin', 'Procurement Officer', 'Vendor', 'Manager'];

const ROLE_ALIASES = {
  admin: 'Admin',
  'procurement-officer': 'Procurement Officer',
  'procurement officer': 'Procurement Officer',
  vendor: 'Vendor',
  manager: 'Manager',
};

const normalizeRole = (role) => {
  if (!role) return 'Procurement Officer';

  const trimmed = String(role).trim();
  if (USER_ROLES.includes(trimmed)) return trimmed;

  const alias = ROLE_ALIASES[trimmed.toLowerCase()];
  return alias || trimmed;
};

module.exports = { USER_ROLES, ROLE_ALIASES, normalizeRole };
