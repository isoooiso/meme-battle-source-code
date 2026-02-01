import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const CONTRACT_ADDRESS = import.meta.env.VITE_GENLAYER_CONTRACT_ADDRESS
const ENDPOINT = import.meta.env.VITE_GENLAYER_RPC || 'https://studio.genlayer.com/api'

function requireAddress() {
  if (!CONTRACT_ADDRESS || !CONTRACT_ADDRESS.startsWith('0x')) {
    throw new Error('Missing VITE_GENLAYER_CONTRACT_ADDRESS. Rebuild the app with correct env.')
  }
}

let cached = {
  address: '',
  endpoint: '',
  account: '',
  client: null,
  initPromise: null
}

async function makeClient(userAddress) {
  requireAddress()

  const addr = String(CONTRACT_ADDRESS)
  const ep = String(ENDPOINT)
  const acct = String(userAddress || '')

  if (!acct.startsWith('0x')) {
    throw new Error('Invalid user address')
  }

  const same =
    cached.client &&
    cached.address === addr &&
    cached.endpoint === ep &&
    cached.account.toLowerCase() === acct.toLowerCase()

  if (same && cached.initPromise) {
    await cached.initPromise
    return cached.client
  }

  const client = createClient({
    chain: studionet,
    endpoint: ep,
    account: acct
  })

  const initPromise = client.initializeConsensusSmartContract()

  cached = {
    address: addr,
    endpoint: ep,
    account: acct,
    client,
    initPromise
  }

  await initPromise
  return client
}

function safeJsonParse(value, fallback) {
  try {
    if (typeof value === 'string') return JSON.parse(value)
    return fallback
  } catch {
    return fallback
  }
}

export async function generateSituation(userAddress) {
  const client = await makeClient(userAddress)
  const seed = String(Math.floor(Math.random() * 1e9))

  const res = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'generate_situation',
    args: [seed]
  })

  return typeof res === 'string' ? res : String(res ?? '')
}

export async function rateAnswer(userAddress, situation, answer) {
  const client = await makeClient(userAddress)

  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'rate_answer',
    args: [String(situation || ''), String(answer || '')],
    value: 0n
  })

  await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    retries: 80,
    interval: 5000
  })

  const jsonStr = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_last_result',
    args: [userAddress]
  })

  const parsed = safeJsonParse(jsonStr, { score: 0, rating: '0/10', feedback: '' })
  const score = Number(parsed.score ?? 0)

  return {
    score,
    feedback: String(parsed.feedback ?? ''),
    rating: String(parsed.rating ?? `${score}/10`)
  }
}

export async function submitScore(userAddress, totalScore) {
  const client = await makeClient(userAddress)

  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'submit_score',
    args: [userAddress, BigInt(Number(totalScore) || 0)],
    value: 0n
  })

  await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    retries: 80,
    interval: 5000
  })

  return true
}

export async function getLeaderboard(userAddress) {
  const client = await makeClient(userAddress)

  const jsonStr = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_leaderboard',
    args: [5n]
  })

  const arr = safeJsonParse(jsonStr, [])
  if (!Array.isArray(arr)) return []

  return arr.map((row) => ({
    address: String(row.address ?? ''),
    score: Number(row.score ?? 0)
  }))
}
