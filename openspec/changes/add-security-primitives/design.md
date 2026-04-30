# Design: security primitives

## Xero signature

- Algorithm: HMAC-SHA256 over the raw request body bytes.
- Header: `x-xero-signature` as standard base64 digest bytes.
- Comparison: `crypto.timingSafeEqual` on equal-length buffers.

## Bank normalization

- Trim outer whitespace.
- Remove ASCII spaces, dots, and hyphens.
- Strip remaining non-alphanumeric characters for a stable comparison string.

## Token encryption

- Algorithm: AES-256-GCM.
- Key: 32 raw UTF-8 bytes, or SHA-256 of shorter passphrase material.
- Wire format: base64(iv 12 bytes || ciphertext || tag 16 bytes).
