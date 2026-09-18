# Ice Breaker Voice Agent — Architecture

## Architectural direction

Use a web-first, thin-client architecture. Keep browser responsibilities focused on user interaction and audio capture, and keep provider credentials and agent orchestration on a small server boundary. Start with one session in memory and replace providers behind interfaces so the demo can evolve without rewriting the UI.

## System flow

```text
User
  ↓ speaks
Web client
  ├─ microphone permission and recording state
  ├─ audio capture
  ├─ transcript and response display
  └─ audio playback
       ↓ HTTPS
Voice/session API
  ├─ validates request and session state
  ├─ speech-to-text adapter
  ├─ ice-breaker agent adapter
  └─ text-to-speech adapter
       ↓
External AI providers
```

## Components

### Web client

- Presents the scenario and explicit Start, Stop, and Another idea controls.
- Requests microphone access only after a user action.
- Clearly shows `idle`, `recording`, `processing`, `speaking`, and `error` states.
- Renders the transcript and response text for accessibility and debugging.
- Stops tracks and clears temporary audio when a session ends.

### Voice/session API

- Accepts a short audio clip or transcript with a session identifier.
- Enforces input size, duration, and rate limits appropriate for a demo.
- Orchestrates transcription, response generation, and speech synthesis.
- Returns a stable response shape such as:

  ```json
  {
    "transcript": "...",
    "message": "...",
    "audioUrl": "...",
    "suggestedFollowUp": "..."
  }
  ```

- Never exposes provider API keys to the browser.

### Agent prompt and session state

- Input: setting, participant context volunteered by the user, transcript, and turn count.
- Output: one concise question, optional rationale, and one follow-up.
- Tone: warm, inclusive, low-pressure, and curious.
- Guardrails: do not request secrets, infer sensitive traits, pressure disclosure, or generate harassment, sexual content, or discriminatory prompts.
- Keep only the minimum session state needed for the current demo; do not persist raw audio or transcripts by default.

## Recommended implementation choices

- Frontend: the project’s existing web framework, with browser MediaRecorder and Web Audio APIs where supported.
- Server: the project’s existing server runtime and a single `/api/voice-turn` endpoint.
- Transport: HTTPS JSON plus short-lived audio objects or response bytes.
- Configuration: environment variables for provider keys, model names, limits, and allowed origins.
- Testing: unit tests for prompt/response validation and manual browser checks for microphone permissions and playback.

## Reliability and privacy

- Require explicit microphone consent and show an always-visible recording indicator.
- Apply timeouts and return readable errors when a provider is unavailable.
- Validate and truncate unexpectedly long input before sending it to a model.
- Avoid logging raw audio or full transcripts; log request IDs, durations, and error categories only.
- Add a cleanup path for temporary audio and never commit secrets or local configuration.

## Evolution path

1. Replace in-memory sessions with a short-lived store only if the product needs reconnects.
2. Add streaming transcription and audio responses if latency is the main demo problem.
3. Add authentication and durable storage only after users demonstrate a need for saved sessions.
4. Add a native app only after the web flow validates the interaction and prompt quality.
