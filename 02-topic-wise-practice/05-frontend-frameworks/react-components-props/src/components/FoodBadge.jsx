// Indian-style veg / non-veg mark, chosen from a boolean prop
export default function FoodBadge({ veg }) {
  return (
    <span className={`food-badge ${veg ? 'veg' : 'nonveg'}`} title={veg ? 'Vegetarian' : 'Non-vegetarian'}>
      <span className="dot" />
    </span>
  )
}
