# Ice Breaker Voice Agent — MVP Plan

## Product intent

Build a small, web-first voice agent that helps two or more people start a conversation. The agent should feel warm, quick, and useful: it listens for a little context, suggests an ice-breaker, and can keep the exchange moving with one or two optional follow-up prompts.

## Definition of done

- A user can open the web app and start a voice session without setup beyond microphone permission.
- The agent can hear a short introduction, transcribe it, and respond with natural spoken audio.
- The agent produces an ice-breaker grounded in the available context rather than a random generic question.
- The experience handles microphone denial, empty input, long pauses, and service errors gracefully.
- The demo can be completed in roughly one minute.
- The story can be explained in 2–3 slides: problem and experience, system flow, and next steps.

## Suggested MVP experience

1. Show a simple landing screen with the prompt: “Tell me who you’re meeting and I’ll help break the ice.”
2. The user presses “Start,” grants microphone access, and says a brief description of the people or setting.
3. The agent responds with one tailored, low-pressure question and displays the text while speaking it aloud.
4. The user can answer or tap “Another idea.” The agent gives one follow-up or a second option, then ends with a clear next action.

## Delivery phases

### Phase 1 — Slice the demo

- Choose a single happy-path scenario, such as meeting a new teammate.
- Define the voice, boundaries, and exact one-minute script.
- Create the 2–3 slide narrative before adding extra features.

### Phase 2 — Build the web loop

- Add a start/stop microphone control and visible recording state.
- Capture audio, transcribe it, send the transcript plus scenario context to the agent, and play the response.
- Show transcript, response text, and a compact error state so the experience remains understandable without audio.

### Phase 3 — Make it demo-ready

- Add a short loading state and graceful retry behavior.
- Test Chrome/Safari microphone permissions, silence, interruption, and repeated prompts.
- Tune the prompt to avoid invasive, polarizing, or overly personal questions.
- Rehearse the one-minute demo and capture the final screenshots or slides.

## Initial backlog

- [ ] Web page with a clear start button and scenario copy.
- [ ] Browser microphone capture with permission and failure states.
- [ ] Speech-to-text and text-to-speech integration behind a small service boundary.
- [ ] Agent prompt and response schema for concise ice-breakers.
- [ ] Conversation state for the current session only; no persistence in the MVP.
- [ ] “Another idea” and “Stop” controls.
- [ ] Basic manual test checklist and demo script.
- [ ] 2–3 slides covering the user problem, architecture, and roadmap.

## Out of scope for the MVP

- User accounts, saved conversations, analytics, and multi-session history.
- Background listening or automatic recording.
- Contact import, face recognition, emotion detection, or sensitive-personal-data inference.
- Native mobile apps before the web experience is reliable.

## Success signals

- A first-time user can start the experience and understand what to do without explanation.
- The agent responds within a few seconds and the answer feels specific to the stated context.
- The complete happy path fits comfortably in one minute.
- The user can always see when the microphone is active and can stop it immediately.
