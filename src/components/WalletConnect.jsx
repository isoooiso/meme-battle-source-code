import { useMemo, useState } from 'react'
import { ethers } from 'ethers'

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

async function connectWallet() {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    return { provider, signer, address }
  } else {
    alert('Please install MetaMask!')
  }
}

export default function WalletConnect({ onConnected }) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState('')

  const shortAddress = useMemo(() => (connectedAddress ? formatAddress(connectedAddress) : ''), [connectedAddress])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const res = await connectWallet()
      if (!res?.address) return
      setConnectedAddress(res.address)
      onConnected?.(res)
    } catch (e) {
      const msg = e?.message || 'Failed to connect wallet'
      alert(msg)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full mx-auto fade-in">
        <div className="text-center">
          <div className="text-5xl mb-4">🎭</div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">Meme Battle</h1>
          <p className="text-text-secondary mb-8">Connect your wallet to start playing</p>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none inline-flex items-center justify-center gap-3 w-full"
          >
            <span className="text-2xl">👛</span>
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>

          {shortAddress ? (
            <div className="mt-6 text-sm text-text-secondary">
              Connected: <span className="font-semibold text-text-primary">{shortAddress}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
