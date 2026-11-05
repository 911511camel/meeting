# Bilingual Bridge — Multi-Party Crypto Deal Room

A cyberpunk, bilingual (EN/RU) deal-room interface for multi-party crypto negotiations:
chat with buyer, seller, escrow arbiter and notary roles, a live contract board, and an
exportable deal procedure — all client-side, no server, no logs.

Branded for **NIKOLAS SEGURADO — STARTUP PROJECT**.

- Live site: https://meeting.niko.center/
- Static site, no build step

## Interface language (EN / RU)

The first screen (access gate) has an **EN | RU** switch in the top-right corner.
The choice translates the whole access layer (gate, registration, rooms, sessions,
dialogs) and also drives the deal room's own bilingual UI; picking EN/RU inside the
deal room switches the access layer back. The choice is stored in `localStorage`
(`nsa.v1.lang`) and restored on the next visit.

## Access flow (local build)

1. **Gate** — the terminal asks for an access code. Default: `NIKOLAS-2077`
   (change `ACCESS_CODE` at the top of `app.js`).
2. **Register / sign in** — new users pick a name, a password and the languages they speak.
3. **Choose room** — Crypto or Bank protocols.
4. **Sessions** — each room lists its sessions; create a new one (name + password) or join an existing one.
5. **One-time password entry** — a session password is asked once per browser tab, then remembered for that tab.
6. **History from the beginning** — every registered user opening a session replays all stored messages, oldest first.

Passwords are salted and hashed with an iterative local hash before being written to storage.
This is a client-side demo hash, not a substitute for server-side authentication.

## Where the data lives

Everything is stored in the browser: `localStorage` for users and sessions,
`sessionStorage` for the gate/unlock state. There is no backend, so two different
machines/browsers do not share accounts, rooms or session history.

## Run locally

```bash
python -m http.server 8080
```

or just open `index.html` in a browser.

## Files

- `index.html` — deal-room UI (chat, contract board, bilingual copy)
- `app.css` — gate / registration / rooms / sessions styling
- `app.js` — access layer: gate, accounts, rooms, password-protected sessions, history