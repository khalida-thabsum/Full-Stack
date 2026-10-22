import FoodBadge from './FoodBadge'
import SpiceMeter from './SpiceMeter'

// Each piece of data comes in as a separate prop
export default function RecipeCard({ title, region, veg, spice, minutes, onOpen }) {
  return (
    <article className="recipe">
      <div className="recipe-top">
        <FoodBadge veg={veg} />
        <span className="time">{minutes} min</span>
      </div>
      <h2>{title}</h2>
      <p className="region">{region}</p>
      <SpiceMeter level={spice} />
      <button className="view" onClick={onOpen}>View recipe</button>
    </article>
  )
}
