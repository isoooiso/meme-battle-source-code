import { useEffect, useMemo, useState } from 'react'
import SituationCard from './SituationCard.jsx'
import AnswerForm from './AnswerForm.jsx'
import ResultCard from './ResultCard.jsx'
import Leaderboard from './Leaderboard.jsx'
import ConfettiEffect from './ConfettiEffect.jsx'
import { generateSituation, getLeaderboard, rateAnswer, submitScore } from '../services/contractService.js'

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function renderStars(score) {
  const fullStars = Math.floor(score / 2)
  return '⭐'.repeat(fullStars)
}

export default function GameScreen({ walletAddress, onDisconnect }) {
  const [gameState, setGameState] = useState('idle')
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds] = useState(5)
  const [scores, setScores] = useState([])
  const [situation, setSituation] = useState('')
  const [currentRating, setCurrentRating] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  const shortAddress = useMemo(() => formatAddress(walletAddress), [walletAddress])
  const totalScore = useMemo(() => scores.reduce((a, b) => a + b, 0), [scores])
  const averageRating = useMemo(() => (scores.length ? (totalScore / scores.length).toFixed(1) : '0.0'), [scores, totalScore])

  async function loadNextSituation() {
    setIsLoading(true)
    try {
      const sit = await generateSituation(walletAddress)
      setSituation(sit)
    } finally {
      setIsLoading(false)
    }
  }

  async function startGame() {
    setGameState('playing')
    setCurrentRound(1)
    setScores([])
    setCurrentRating(null)
    setLeaderboard([])
    await loadNextSituation()
  }

  async function handleSubmitAnswer(answer) {
    if (!answer.trim()) {
      alert('Please enter your answer!')
      return
    }

    setIsLoading(true)
    try {
      const result = await rateAnswer(walletAddress, situation, answer)
      setCurrentRating(result)
      setScores((prev) => [...prev, result.score])
      setGameState('result')
    } finally {
      setIsLoading(false)
    }
  }

  async function endGame(finalScores) {
    const finalTotal = finalScores.reduce((a, b) => a + b, 0)
    try {
      await submitScore(walletAddress, finalTotal)
    } catch (e) {
      void e
    }
    const lb = await getLeaderboard(walletAddress)
    setLeaderboard(lb)
    setGameState('finished')
  }

  async function handleNextRound() {
    if (currentRound < totalRounds) {
      setCurrentRound((r) => r + 1)
      setGameState('playing')
      setCurrentRating(null)
      await loadNextSituation()
    } else {
      await endGame(scores)
    }
  }

  useEffect(() => {
    if (gameState === 'playing' && !situation && !isLoading) {
      loadNextSituation()
    }
  }, [gameState])

  const header = (
    <div className="max-w-2xl mx-auto w-full flex items-center justify-between text-white mb-6 px-1">
      <div className="font-bold">Round {currentRound}/{totalRounds}</div>
      <div className="font-bold">Score: {totalScore}/{totalRounds * 10}</div>
    </div>
  )

  const loadingBlock = (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in mt-6">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">AI is thinking...</span>
      </div>
    </div>
  )

  const handlePlayAgain = async () => {
    setSituation('')
    await startGame()
  }

  const handleShare = async () => {
    const text = `Meme Battle score: ${totalScore}/${totalRounds * 10} (avg ${averageRating}/10)`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meme Battle', text })
        return
      }
    } catch (e) {
      void e
    }
    try {
      await navigator.clipboard.writeText(text)
      alert('Score copied to clipboard!')
    } catch (e) {
      alert(text)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {gameState === 'idle' ? (
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in w-full">
          <div className="text-center">
            <div className="text-5xl mb-4">🎭</div>
            <h1 className="text-4xl font-extrabold text-text-primary">MEME BATTLE</h1>
            <p className="mt-3 text-text-secondary text-lg">Test your meme creativity! AI will judge your humor</p>

            <div className="mt-6 text-text-secondary font-semibold">5 Rounds | Best Score Wins</div>

            <button
              onClick={startGame}
              className="mt-8 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Start Game 🚀
            </button>

            <div className="mt-8 flex items-center justify-center gap-3 text-sm text-text-secondary flex-wrap">
              <span>Wallet: <span className="font-semibold text-text-primary">{shortAddress}</span></span>
              <button onClick={onDisconnect} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gameState === 'playing' ? (
        <div className="w-full">
          {header}
          <SituationCard situation={situation || 'Loading...'} />
          <AnswerForm onSubmit={handleSubmitAnswer} isLoading={isLoading} />
          {isLoading ? loadingBlock : null}
          <div className="mt-6 text-center">
            <button onClick={onDisconnect} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition">
              Disconnect
            </button>
          </div>
        </div>
      ) : null}

      {gameState === 'result' && currentRating ? (
        <div className="w-full">
          <ConfettiEffect trigger={currentRating.score >= 9} />
          <ResultCard
            rating={currentRating.rating}
            feedback={currentRating.feedback}
            roundScore={currentRating.score}
            totalScore={totalScore}
            totalPossible={currentRound * 10}
            onNext={handleNextRound}
          />
          <div className="mt-6 text-center">
            <button onClick={onDisconnect} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition">
              Disconnect
            </button>
          </div>
        </div>
      ) : null}

      {gameState === 'finished' ? (
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in">
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-3xl font-extrabold text-text-primary">GAME OVER!</h2>
              <div className="mt-4 text-text-secondary text-lg">
                Your Final Score: <span className="font-extrabold text-text-primary">{totalScore}/{totalRounds * 10}</span>
              </div>
              <div className="mt-1 text-text-secondary">
                Average Rating: <span className="font-bold text-text-primary">{averageRating}/10</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm uppercase tracking-wider text-text-secondary mb-3">Your rounds</div>
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="font-semibold text-text-primary">Round {i + 1}: <span className="text-text-secondary font-medium">{s}/10</span></div>
                    <div className="text-accent font-bold">{renderStars(s)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handlePlayAgain}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Play Again 🔄
              </button>
              <button
                onClick={handleShare}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition"
              >
                Share Score 📤
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-text-secondary">
              Wallet: <span className="font-semibold text-text-primary">{shortAddress}</span>
              <button onClick={onDisconnect} className="ml-3 bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition">
                Disconnect
              </button>
            </div>
          </div>

          <Leaderboard entries={leaderboard} currentUserAddress={walletAddress} currentUserScore={totalScore} />
        </div>
      ) : null}
    </div>
  )
}
