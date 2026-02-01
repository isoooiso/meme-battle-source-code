function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Leaderboard({ entries, currentUserAddress, currentUserScore }) {
  const normalized = (entries || []).map((e) => ({ address: e.address, score: Number(e.score) || 0 }))
  const withUser = (() => {
    if (!currentUserAddress) return normalized
    const exists = normalized.some((e) => (e.address || '').toLowerCase() === currentUserAddress.toLowerCase())
    if (exists) return normalized
    return [...normalized, { address: currentUserAddress, score: Number(currentUserScore) || 0 }]
  })()

  const sorted = withUser
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in mt-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-extrabold text-text-primary">🏅 Leaderboard</div>
        <div className="text-sm text-text-secondary">Top 5</div>
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((row, idx) => {
          const isYou = currentUserAddress && row.address.toLowerCase() === currentUserAddress.toLowerCase()
          const rank = idx + 1
          const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ''
          return (
            <div
              key={`${row.address}-${idx}`}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${isYou ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-text-secondary">{rank}.</div>
                <div className="font-semibold text-text-primary">
                  {isYou ? 'You!' : formatAddress(row.address)} <span className="ml-2">{medal}</span>
                </div>
              </div>
              <div className="font-extrabold text-text-primary">{row.score}/50</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
