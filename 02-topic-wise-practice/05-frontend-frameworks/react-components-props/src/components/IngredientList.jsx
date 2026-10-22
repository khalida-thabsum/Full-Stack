// Renders any array of strings as a checklist
export default function IngredientList({ items }) {
  return (
    <ul className="ingredients">
      {items.map(item => (
        <li key={item}>
          <label><input type="checkbox" /> {item}</label>
        </li>
      ))}
    </ul>
  )
}
