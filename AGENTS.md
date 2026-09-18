# Project Agent Guidelines

## Scope

This repository contains a web-preferred voice agent that helps people start conversations. Keep the MVP focused on a reliable, one-minute happy path and the 2–3 slide story described in `GOAL.md` and `PLAN.md`.

## Working agreements

- Read `GOAL.md`, `PLAN.md`, and `ARCHITECTURE.md` before making product or architecture changes.
- Prefer the existing framework, scripts, and dependency choices. Do not add a provider or framework without explaining why it is needed.
- Keep changes small and easy to demo. Avoid building accounts, persistence, analytics, or native apps unless explicitly requested.
- Preserve user changes and inspect the working tree before broad edits.
- Use clear names and simple state transitions over clever abstractions.

## Voice UX requirements

- Make microphone permission explicit and user-initiated.
- Always make recording, processing, speaking, and error states visible.
- Provide a stop/cancel path at every point where audio is captured or played.
- Show text alongside audio so the core interaction remains understandable and accessible.
- Keep responses concise, warm, inclusive, and grounded in user-provided context.

## Privacy and security

- Never hardcode API keys, tokens, credentials, or private endpoints.
- Keep provider credentials on the server and load them from environment variables or the project’s established secret mechanism.
- Do not persist raw audio, transcripts, contacts, or inferred personal attributes without explicit product approval.
- Minimize logs; use request IDs and error categories instead of sensitive content.
- Validate audio type, duration, request size, and model output before use.

## Implementation and verification

- Add or update tests for parsing, session state, request validation, and agent response constraints when behavior changes.
- Before finishing, run the most relevant available checks and manually verify the voice flow in a supported browser when practical.
- Check microphone denial, silence, provider failure, playback failure, stopping mid-turn, and repeated prompts.
- Verify that no secrets, generated audio, or local environment files are staged.

## Definition of a good demo change

A reviewer should be able to understand the user value quickly, run the web flow without hidden setup, see what the agent is doing, stop it safely, and complete the happy path in about one minute.
