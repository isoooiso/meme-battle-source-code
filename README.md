# Meme Battle

Solo meme game where you write punchlines and the GenLayer contract rates your creativity.

## Tech
- React (Vite)
- Tailwind CSS
- ethers.js (MetaMask connect)
- GenLayerJS (contract calls)
- canvas-confetti
- gh-pages deployment

## 1) Run locally
```bash
npm install
cp .env.example .env
npm run dev
```

## 2) Deploy the GenLayer contract
The contract lives in `contracts/meme_battle_contract.py`.

### Option A — GenLayer Studio (recommended)
1. Install and start the Studio (CLI):
```bash
npm install -g genlayer
genlayer init
genlayer up
```
2. Open the Studio at `http://localhost:8080/`
3. Go to **Contracts** → upload `contracts/meme_battle_contract.py`
4. Go to **Run & Deploy** → click **Deploy**
5. Copy the deployed **contract address**

### Important
AI scoring requires at least one validator configured with an LLM provider inside the Studio.

## 3) Configure the frontend
Put the contract address into `.env`:

```bash
VITE_GENLAYER_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
VITE_GENLAYER_CHAIN=studionet
# optional (only if you want to override the default chain endpoint)
# VITE_GENLAYER_RPC=http://localhost:8545
# optional (force UI to run without chain)
# VITE_MOCK_MODE=true
```

## Build
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages
1. Create a GitHub repo (example: `meme-battle`).
2. In `vite.config.js`, set:
```js
base: '/YOUR_REPO_NAME/'
```
3. Push to GitHub, then run:
```bash
npm run deploy
```

## Contract upgrade checklist
When you deploy a new contract version:
- Update `VITE_GENLAYER_CONTRACT_ADDRESS`
- If you switch networks, update `VITE_GENLAYER_CHAIN` (and `VITE_GENLAYER_RPC` if needed)
- If your contract ABI changes (method names / args), update `src/services/contractService.js`
