# Security primitives

## Purpose

Shared cryptographic and normalization utilities for webhooks and secret handling.

## Requirements

### Requirement: Xero webhook HMAC verification

The system MUST verify `x-xero-signature` using HMAC-SHA256 over the raw body with constant-time comparison.

#### Scenario: Valid signature

- **WHEN** the header matches HMAC-SHA256(body, signing key) as base64
- **THEN** verification succeeds.

#### Scenario: Invalid signature

- **WHEN** the header is missing, malformed, or keyed with a different secret
- **THEN** verification fails.

### Requirement: Bank detail normalization

The system MUST normalize bank detail strings for hashing by removing common separators and non-alphanumeric noise.

#### Scenario: Separator stripping

- **WHEN** input contains spaces, dots, and hyphens
- **THEN** those characters are removed from the normalized output.

### Requirement: Token encryption

The system MUST encrypt and decrypt UTF-8 token strings using AES-256-GCM with an authenticated tag.

#### Scenario: Round trip

- **WHEN** a plaintext token is encrypted then decrypted with the same key material
- **THEN** the decrypted value equals the original plaintext.
