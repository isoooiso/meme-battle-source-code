function renderStars(score) {
  const fullStars = Math.floor(score / 2)
  return '⭐'.repeat(fullStars)
}

export default function ResultCard({ rating, feedback, roundScore, totalScore, totalPossible, onNext }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-2xl font-extrabold text-text-primary">🎉 AI Rating: {rating}</div>
        <div className="text-base text-accent font-bold">{renderStars(roundScore)} <span className="text-text-secondary font-medium ml-2">{roundScore}/10</span></div>
      </div>

      <div className="mt-6">
        <div className="text-sm uppercase tracking-wider text-text-secondary mb-2">AI Feedback</div>
        <div className="text-lg text-text-primary leading-relaxed">“{feedback}”</div>
      </div>

      <div className="mt-6 text-text-secondary">
        Your Score: <span className="font-bold text-text-primary">{totalScore}/{totalPossible}</span>
      </div>

      <button
        onClick={onNext}
        className="mt-8 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 w-full"
      >
        Next Round →
      </button>
    </div>
  )
}
