# ezit.ai

## The AI Operating Platform for Real-World Entities

---

## Overview

**ezit.ai** is an all-in-one AI operating platform that helps businesses, creators, professionals, and public-facing brands build a complete digital presence from a single input. Create an entity, generate a polished website, publish it on your own **entityname.ezit.ai** subdomain, and activate a 24/7 AI concierge — all without juggling disconnected tools.

---

## Core Capabilities

### Entity Creation
Create a structured profile for your business, brand, campaign, or professional practice. Upload details once and let AI shape the public experience.

### AI Website Studio
Generate a complete, responsive website from a prompt, menu, brochure, or PDF. Publish instantly on your own `entityname.ezit.ai` subdomain with no agency overhead.

### AI Chatbot & Concierge
Every published site includes a 24/7 AI chatbot that can answer questions, capture leads, support customers, take bookings, and guide orders — powered by your uploaded documents and entity data.

### Image & Campaign Studio
Create campaign-ready posters and promotional visuals with AI generation and editable layers. One-click social publishing and scheduled promotions.

### Retrospectives & Feedback
Run structured retrospective sessions, collect team and customer feedback, and let AI synthesize insights, sentiment, and improvement priorities.

### Memory & Improvement System
A built-in memory layer stores feedback, decisions, and context over time — grounding every improvement in real data rather than guesswork.

### Followers & Community
Build verified audiences around your entities. Users can follow, engage, and provide feedback in a trust-first environment.

---

## Tech Stack

- **Frontend**: Angular 18 with SSR (server-side rendering)
- **Styling**: SCSS with Angular Material
- **Hosting**: Render (with custom domain routing on ezit.ai)
- **AI**: Integrated chatbot services, document understanding, image generation

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Development Server
```bash
ng serve
```
Navigate to `http://localhost:4200/`.

### Build
```bash
ng build
```
Build artifacts are stored in the `dist/` directory.

### SSR (Server-Side Rendering)
```bash
npm run serve:ssr:true-pulse-ai-client
```

---

## Project Structure

```
src/
  app/
    components/     # Feature components (entity creation, website studio, dashboard, etc.)
    models/         # TypeScript interfaces and data models
    services/       # API services, auth, feature services
    utils/          # Shared utilities (domain resolution, etc.)
  assets/           # Static assets (logos, images)
  environments/     # Environment configs (dev, prod)
```

---

## Contact

**Website:** [ezit.ai](https://ezit.ai)
**Email:** ravurinagaphanindra@gmail.com

---

*ezit.ai — Build your entity. Launch your website. Let AI run the heavy lifting.*
