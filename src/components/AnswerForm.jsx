import { useMemo, useState } from 'react'

export default function AnswerForm({ onSubmit, isLoading }) {
  const [textAnswer, setTextAnswer] = useState('')
  const [gifUrl, setGifUrl] = useState('')

  const canSubmit = useMemo(() => {
    const hasText = textAnswer.trim().length > 0
    const hasGif = gifUrl.trim().length > 0
    return (hasText || hasGif) && !isLoading
  }, [textAnswer, gifUrl, isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    const answer = textAnswer.trim()
    const gif = gifUrl.trim()

    const combined = [answer, gif ? `GIF: ${gif}` : ''].filter(Boolean).join('\n')
    onSubmit?.(combined)

    setTextAnswer('')
    setGifUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in mt-6">
      <div className="text-sm uppercase tracking-wider text-text-secondary mb-2">Your meme answer</div>
      <textarea
        value={textAnswer}
        onChange={(e) => setTextAnswer(e.target.value)}
        placeholder="Type your funny response..."
        className="w-full p-4 border-2 border-gray-300 rounded-lg h-32 resize-none focus:border-purple-500 focus:outline-none transition"
        disabled={isLoading}
      />

      <div className="mt-6 text-sm text-text-secondary mb-2">Or paste GIF URL from Giphy/Tenor</div>
      <input
        value={gifUrl}
        onChange={(e) => setGifUrl(e.target.value)}
        placeholder="https://..."
        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition"
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-8 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none w-full"
      >
        Submit Answer ✨
      </button>
    </form>
  )
}
