// Draws up to "max" chillies and fills "level" of them
export default function SpiceMeter({ level, max = 3 }) {
  if (level === 0) return <p className="spice">Not spicy</p>
  return (
    <p className="spice" aria-label={`Spice level ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < level ? 'chilli on' : 'chilli'}>&#9679;</span>
      ))}
    </p>
  )
}
