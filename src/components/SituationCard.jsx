export default function SituationCard({ situation }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto fade-in">
      <div className="text-sm uppercase tracking-wider text-text-secondary mb-2">Situation</div>
      <div className="text-2xl font-bold text-text-primary leading-snug">“{situation}”</div>
    </div>
  )
}
