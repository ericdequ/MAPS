const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60;

const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

const base64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const normalizePrivateKey = (value) => {
  const trimmed = cleanText(value);
  return trimmed.includes('\\n') ? trimmed.replace(/\\n/g, '\n') : trimmed;
};

const decodeBase64PrivateKey = (value) => {
  const text = cleanText(value);
  if (!text) return '';
  try {
    return Buffer.from(text, 'base64').toString('utf8').trim();
  } catch {
    return '';
  }
};

export function normalizeAppleMapsTokenOrigin(value) {
  const trimmed = cleanText(value).replace(/\/+$/g, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function parseJwtPayload(token) {
  const parts = cleanText(token).split('.');
  if (parts.length < 2) return null;
  try {
    let input = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = input.length % 4;
    if (pad) input += '='.repeat(4 - pad);
    return JSON.parse(Buffer.from(input, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function getJwtExpiry(token) {
  const exp = parseJwtPayload(token)?.exp;
  return Number.isFinite(exp) ? exp : null;
}

export function isJwtExpired(
  token,
  nowSec = Math.floor(Date.now() / 1000),
  skewSec = 60
) {
  const exp = getJwtExpiry(token);
  return Boolean(exp && exp <= nowSec + skewSec);
}

const readDerLength = (buffer, offset) => {
  let length = buffer[offset++];
  if (length & 0x80) {
    const bytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < bytes; i += 1) {
      length = (length << 8) + buffer[offset++];
    }
  }
  return { length, offset };
};

const readDerInteger = (buffer, offset) => {
  if (buffer[offset++] !== 0x02) return null;
  const lenInfo = readDerLength(buffer, offset);
  const value = buffer.slice(lenInfo.offset, lenInfo.offset + lenInfo.length);
  return { value, offset: lenInfo.offset + lenInfo.length };
};

const derToJose = (signature) => {
  const size = 32;
  let offset = 0;
  if (signature[offset++] !== 0x30) return null;
  offset = readDerLength(signature, offset).offset;

  const rInfo = readDerInteger(signature, offset);
  if (!rInfo) return null;
  const sInfo = readDerInteger(signature, rInfo.offset);
  if (!sInfo) return null;

  const r = rInfo.value[0] === 0 ? rInfo.value.slice(1) : rInfo.value;
  const s = sInfo.value[0] === 0 ? sInfo.value.slice(1) : sInfo.value;
  if (r.length > size || s.length > size) return null;

  return Buffer.concat([
    Buffer.concat([Buffer.alloc(size - r.length, 0), r]),
    Buffer.concat([Buffer.alloc(size - s.length, 0), s]),
  ]);
};

export function getAppleMapKitTokenStatus(env = {}) {
  const staticToken = cleanText(
    env.APPLE_MAPKIT_TOKEN || env.MAPKIT_TOKEN || env.MAPKIT_JS_TOKEN
  );
  const teamId = cleanText(env.APPLE_MAPKIT_TEAM_ID || env.MAPKIT_TEAM_ID);
  const keyId = cleanText(env.APPLE_MAPKIT_KEY_ID || env.MAPKIT_KEY_ID);
  const privateKey =
    normalizePrivateKey(env.APPLE_MAPKIT_PRIVATE_KEY || env.MAPKIT_PRIVATE_KEY) ||
    decodeBase64PrivateKey(
      env.APPLE_MAPKIT_PRIVATE_KEY_BASE64 || env.MAPKIT_PRIVATE_KEY_BASE64
    );
  const hasSigningKeys = Boolean(teamId && keyId && privateKey);
  const expiredStaticToken = Boolean(staticToken && isJwtExpired(staticToken));

  return Object.freeze({
    configured: hasSigningKeys || Boolean(staticToken && !expiredStaticToken),
    mode: hasSigningKeys
      ? 'signing-keys'
      : expiredStaticToken
        ? 'expired-static-token'
        : staticToken
          ? 'static-token'
          : 'missing',
    hasSigningKeys,
    hasStaticToken: Boolean(staticToken),
    expiredStaticToken,
    publicTokenEndpoint:
      cleanText(env.NEXT_PUBLIC_APPLE_MAPKIT_TOKEN_ENDPOINT) ||
      '/api/maps/apple-token',
  });
}

export async function buildAppleMapKitJwt({
  env = {},
  origin = '',
  nowSec = Math.floor(Date.now() / 1000),
  ttlSeconds =
    Number(env.APPLE_MAPS_TOKEN_TTL_SECONDS) || DEFAULT_TOKEN_TTL_SECONDS,
} = {}) {
  const teamId = cleanText(env.APPLE_MAPKIT_TEAM_ID || env.MAPKIT_TEAM_ID);
  const keyId = cleanText(env.APPLE_MAPKIT_KEY_ID || env.MAPKIT_KEY_ID);
  const privateKey =
    normalizePrivateKey(env.APPLE_MAPKIT_PRIVATE_KEY || env.MAPKIT_PRIVATE_KEY) ||
    decodeBase64PrivateKey(
      env.APPLE_MAPKIT_PRIVATE_KEY_BASE64 || env.MAPKIT_PRIVATE_KEY_BASE64
    );
  if (!teamId || !keyId || !privateKey) return '';

  const crypto = await import('node:crypto');
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const payload = {
    iss: teamId,
    iat: nowSec,
    exp: nowSec + ttlSeconds,
  };
  const safeOrigin = normalizeAppleMapsTokenOrigin(origin);
  if (safeOrigin) payload.origin = safeOrigin;

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload)
  )}`;
  const signer = crypto.createSign('SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = derToJose(signer.sign(privateKey));
  return signature ? `${unsignedToken}.${base64Url(signature)}` : '';
}
