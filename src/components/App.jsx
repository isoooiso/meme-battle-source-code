import { useCallback, useState } from 'react'
import WalletConnect from './components/WalletConnect.jsx'
import GameScreen from './components/GameScreen.jsx'

export default function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)

  const handleConnected = useCallback(({ provider: p, signer: s, address }) => {
    setProvider(p)
    setSigner(s)
    setWalletAddress(address)
  }, [])

  const handleDisconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setWalletAddress('')
  }, [])

  return (
    <div className="min-h-screen bg-app-gradient">
      {!walletAddress ? (
        <WalletConnect onConnected={handleConnected} />
      ) : (
        <GameScreen walletAddress={walletAddress} provider={provider} signer={signer} onDisconnect={handleDisconnect} />
      )}
    </div>
  )
}
