# Scaffold Capability Spec

## Purpose
Define the minimum runnable application scaffold required before feature implementation.

## Requirements

### Requirement: Local development runnable
The repository MUST provide scripts and files needed to run a local Next.js development server.

#### Scenario: Run development server
- **WHEN** a developer runs `npm run dev`
- **THEN** the Next.js app starts successfully.

### Requirement: Build and static checks
The repository MUST support lint, typecheck, and production build commands for CI.

#### Scenario: CI verification
- **WHEN** CI runs lint, typecheck, and build
- **THEN** commands exit successfully on a clean checkout.

### Requirement: Baseline health endpoint
The scaffold MUST expose a basic health endpoint.

#### Scenario: Health check
- **WHEN** `GET /api/health` is requested
- **THEN** it returns HTTP 200 with a simple JSON status payload.
