# Phase Two

**Payment that releases itself once the work is proven.**

Phase Two is an escrow application built on [GenLayer](https://genlayer.com), where the Intelligent Contract itself locks a deposit and only releases it once independent AI validators fetch the submitted evidence *live* and judge it against the deliverable spec — no oracle, no middleman, no arbitrator.

Live on both **GenLayer Asimov Testnet** and **GenLayer Studio Network**, switchable at runtime from the app.

## How it works

1. **Create the engagement** — the depositor locks a GEN payment, names the counterparty, sets a deadline, and writes the deliverable spec in plain English.
2. **Submit the evidence** — the counterparty submits one or more URLs (a repo, a live deployment, a document) as checkable proof of work.
3. **Validators judge live** — anyone can trigger `request_release`. A random set of GenLayer validators — each often running a different underlying model — independently fetch the evidence themselves and compare it against the spec.
4. **Release, or dispute** — a pass releases funds to the counterparty immediately. A rejection leaves the deposit in place; either party can add evidence and re-trigger judgment, or escalate through GenLayer's protocol-level appeal.
5. **Deterministic refund** — if the deadline passes with nothing submitted, the deposit refunds automatically. No judgment call, no waiting on anyone.

Consensus on the verdict is reached through GenLayer's **Optimistic Democracy**: validators don't need to produce byte-identical output, only agree on the *substance* of the judgment (the [Equivalence Principle](https://docs.genlayer.com)), which makes it resistant to a single model being fooled or hallucinating.

## Architecture

```
contracts/surety.py     GenLayer Intelligent Contract (Python / GenVM)
tests/direct/           Fast in-memory contract tests (no network)
tests/integration/      Tests against a live GenLayer network
frontend/                React + TypeScript + Vite app
```

### Contract

A single Intelligent Contract (class `Surety`) owns the full escrow lifecycle:

| Method | Type | Description |
|---|---|---|
| `create_engagement(counterparty, deliverable_spec, deadline)` | write · payable | Locks the sent value as the deposit, opens a new engagement |
| `submit_deliverable(engagement_id, evidence_urls, notes)` | write · counterparty only, one-time | Attaches evidence, moves the engagement to `submitted`. Blocked once the deadline has passed or after the first submission — further evidence goes through `raise_dispute` |
| `request_release(engagement_id)` | write | Triggers validator judgment — fetches evidence live, releases or rejects based on consensus |
| `raise_dispute(engagement_id, evidence_urls, reason)` | write · either party | Appends evidence and re-triggers judgment after a rejection or release. Blocked once the appeal window has closed on a rejection |
| `refund_expired(engagement_id)` | write | Refunds the deposit if the deadline passed with nothing ever submitted |
| `settle_rejected(engagement_id)` | write · permissionless | Finalizes a rejected engagement once its 3-day appeal window closes with no dispute raised — refunds the deposit to the depositor |
| `add_comment(engagement_id, text)` | write · either party | Posts a message to the engagement's on-chain comment thread, visible to both parties and the public |
| `get_engagement(engagement_id)` | view | Full engagement record, including its comment thread and rejection timestamp |
| `list_engagements_for(address)` | view | Engagement ids where the address is depositor or counterparty |
| `get_appeal_window_seconds()` | view | The configured appeal window, in seconds (3 days by default) |
| `list_all_ids()` | view | All engagement ids (backs the public transparency page) |

Validator judgment uses GenLayer's comparative equivalence principle: each validator independently re-fetches the evidence and re-runs the judgment prompt, then an LLM-mediated comparison checks that the `met` verdict and reasoning substantively agree — no validator's answer is ever trusted unverified.

### Frontend

React 19 + TypeScript + Vite + Tailwind CSS v4, wallet connection via Reown AppKit (WalletConnect), on-chain reads/writes via `genlayer-js`.

- **Landing** (`/`) — marketing page, its own minimal header
- **My Engagements** (`/app`) — search + status-filterable list of your engagements, with an activity indicator for status changes since your last visit
- **Create Engagement** (`/app/create`) — new engagement form
- **Engagement Detail** (`/app/engagement/:id`) — full lifecycle actions: submit, request release, dispute, refund, appeal
- **Transparency** (`/stats`) — public, wallet-free aggregate stats read directly from the contract
- **Docs** (`/docs`) — in-app protocol reference

App pages share a collapsible sidebar shell; a network switcher in the sidebar lets you flip between Asimov Testnet and Studio Network at runtime, each with its own contract deployment, wallet network prompt, and data.

## Networks

| Network | Chain id | Contract address | Notes |
|---|---|---|---|
| **Asimov Testnet** | `4221` | `0x2Ef1AD4c28569acCf61661a2961feF9077Aa0419` | GenLayer's public testnet. Needs testnet GEN — [faucet](https://testnet-faucet.genlayer.foundation/) (100 GEN/claim, weekly) |
| **Studio Network** | `61999` | `0x05Cdc1C4e49F82e8d5aB44D9fB646a4B5814b38C` | Hosted GenLayer Studio. Gasless — no funded account needed |

## Getting started

### Prerequisites

- Node.js ≥ 20, npm
- Python ≥ 3.12
- [GenLayer CLI](https://docs.genlayer.com) (`npm install -g genlayer`) — only needed if you're redeploying the contract

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

`.env.local`:

```bash
VITE_CONTRACT_ADDRESS_ASIMOV=0x2Ef1AD4c28569acCf61661a2961feF9077Aa0419
VITE_CONTRACT_ADDRESS_STUDIONET=0x05Cdc1C4e49F82e8d5aB44D9fB646a4B5814b38C
VITE_REOWN_PROJECT_ID=<your project id from https://dashboard.reown.com>
```

### Contract

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install genlayer-test genvm-linter

genvm-lint check contracts/surety.py    # lint + SDK validation
pytest tests/direct/ -v                 # 19 fast, in-memory tests
```

Integration tests (`tests/integration/`) run against a live network and exercise the full validator-judgment path with real evidence URLs — see `genlayer-dev:integration-tests` if you have the GenLayer Claude Code skill installed, or run with `gltest tests/integration/ -v -s --network <network>` directly.

To redeploy the contract:

```bash
genlayer network set testnet-asimov   # or studionet
genlayer deploy --contract contracts/surety.py
```

## Deployment

The frontend deploys to [Netlify](https://netlify.com) via the included `netlify.toml` (base directory `frontend/`, SPA redirect for client-side routing). Set the three env vars above in the Netlify dashboard before the first build.

## Tech stack

Python · GenVM · React 19 · TypeScript · Vite · Tailwind CSS v4 · `genlayer-js` · Reown AppKit · wagmi · React Router · pytest · Playwright

## License

MIT — see [LICENSE](./LICENSE).
