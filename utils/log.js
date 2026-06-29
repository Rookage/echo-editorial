// Sensitive-data masking for logs
function maskKey(key) {
  if (!key || key.length < 8) return '(unset)';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

function maskAuthHeader(headers) {
  if (!headers) return headers;
  const masked = { ...headers };
  if (masked.Authorization && masked.Authorization.startsWith('Bearer ')) {
    masked.Authorization = 'Bearer ' + maskKey(masked.Authorization.slice(7));
  }
  if (masked.authorization && masked.authorization.startsWith('Bearer ')) {
    masked.authorization = 'Bearer ' + maskKey(masked.authorization.slice(7));
  }
  return masked;
}

module.exports = { maskKey, maskAuthHeader };
