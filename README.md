# Ice Breaker

Ice Breaker is a web-first voice agent that acts as an AI co-host for a party, event, or casual conversation. It listens to the room, keeps a live chat history, identifies speakers on a best-effort basis, and helps move the group into the next activity.

## Demand → solution

### Demand: conversations need a host

Parties and events can lose momentum when guests talk over one another, stay in separate conversations, or run out of natural topics. A human host has to listen, recognize participants, and keep introducing engaging prompts while also participating in the event.

### Solution: Ice Breaker, your AI co-host

Ice Breaker provides a browser-based live conversation flow:

1. The organizer starts a conversation.
2. Guests speak through the browser microphone.
3. Higgs Realtime listens and responds with voice.
4. The conversation transcript appears in the scrollable Chat History window.
5. The party-host agent guides warm, inclusive icebreakers and transitions.

The presentation is available at [ice-breaker-demand-to-solution.pptx](./ice-breaker-demand-to-solution.pptx).

## Features

- Start and end live conversations.
- Browser microphone capture and streamed audio playback.
- Live assistant and guest transcripts.
- Best-effort speaker labels for multiple voices.
- Chat History that remains visible during the conversation.
- Agent behavior defined in [`party-host-agent.md`](./party-host-agent.md).
- Server-side provider credentials; API keys are never sent to the browser.

## Run locally

```bash
npm install
HIGGS_API_KEY=your-key npm start
```

Then open `http://localhost:3000`.

The server also accepts `HIGGINS_API_KEY` for compatibility with the existing deployment configuration. Do not commit API keys; use environment variables or the hosting provider's secret manager.

## Project documentation

- [`GOAL.md`](./GOAL.md) — demo objective and deliverables.
- [`PLAN.md`](./PLAN.md) — implementation plan and one-minute demo flow.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — web client, Node.js relay, and voice-provider architecture.
- [`party-host-agent.md`](./party-host-agent.md) — system prompt and conversation guardrails.
