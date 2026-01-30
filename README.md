# ⏳ TimeCapsule

![TimeCapsule icon](./public/favicon-96x96.png)

> Your life in yearly snapshots. A local-first web app for memories, milestones, and future goals.

Everything stays in your browser. No accounts, no servers, no tracking.

---

## Features

* Add/edit/delete one capsule per year
* Past reflections & future goals
* Timeline view (chronological)
* Auto-save to localStorage
* Export as image or JSON
* Share via compressed URL

Optional: reflection prompts, milestones, playback mode.

---

## Tech

* **Framework:** Astro
* **UI:** React + Tailwind + TypeScript
* **Storage:** localStorage
* **Libraries:** html2canvas, LZ-string
* **Deployment:** Static hosting

---

## AI

Claude & ChatGPT were used to help brainstorm features, refactor code, and write docs. All final decisions and code were human-driven.

---

## Project Structure

```text
/
├── public/           # static assets
├── src/
│   ├── pages/        # routes
│   ├── components/   # UI components
│   └── utils/        # helpers
├── package.json
└── astro.config.mjs
```

---

## Usage

```bash
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321)

---

## Contributing

PRs welcome. Fork → branch → code → PR.

---

## License

MIT
