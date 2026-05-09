# WTF LivePulse - Real-Time Multi-Gym Intelligence Engine

An AI-native implementation of the LivePulse telemetry system, executing a full stack (React, Node.js, PostgreSQL) under extreme time constraints.

## 🚀 Quick Start

This project utilizes a cold-start single-command boot. It seeds 270,000+ rows directly into PostgreSQL via native SQL batching, enabling sub-minute spin-up.

\`\`\`bash
docker-compose up --build
\`\`\`

## 🤖 AI Leverage & Methodology

Per the WTF Engineering Division specifications, this project was architected and developed using AI as a force multiplier to compress a multi-day build into a rapid execution window. Transparency in AI tooling is a core value of this submission.

### Tools Utilized:

- **Gemini (3.1 Pro):** Acted as the core backend and systems copilot. Used for architectural planning, rapid Node.js/Express scaffolding, WebSocket integration, and writing the complex 270,000+ row idempotent PostgreSQL seed script. Gemini was also leveraged to debug Docker networking layers and execute the mathematical logic required for the realistic time-of-day check-in distributions.
- **Claude (Sonnet 4.6):** Acted as the primary frontend UI architect. Used to translate the strict PDF design specifications (dark mode backgrounds, specific teal/red hex codes, and widget layouts) into the final React components and CSS, ensuring the maximalist, data-rich aesthetic requirement was perfectly met.

### Execution Strategy:

By delegating boilerplate code generation, CSS styling, and raw data simulation to LLMs, I was able to act as the Systems Architect. My manual focus was spent entirely on **system integration, real-time performance tuning, and strict compliance with the PRD constraints** (e.g., ensuring global telemetry rules, accurate anomaly detection logic, and sub-second WebSocket broadcasting).

This AI-native workflow successfully compressed the development cycle to meet the high-velocity delivery standards of the WTF Engineering team.

## 🏗️ Architecture Summary

- **Frontend:** React + Vite + Recharts + Lucide Icons
- **Backend:** Node.js + Express + `ws` (WebSockets)
- **Database:** PostgreSQL (with materialized views & BRIN indexing for scale)
- **Testing:** Playwright (E2E UI) + Jest/Supertest (API Integration)
- **Infrastructure:** Docker & Docker Compose
