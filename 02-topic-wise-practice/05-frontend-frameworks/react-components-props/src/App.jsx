import { useState } from 'react'
import recipes from './recipes'
import RecipeCard from './components/RecipeCard'
import Modal from './components/Modal'
import IngredientList from './components/IngredientList'
import Toggle from './components/Toggle'

export default function App() {
  const [open, setOpen] = useState(null)   // recipe shown in the modal
  const [vegOnly, setVegOnly] = useState(false)

  const list = vegOnly ? recipes.filter(r => r.veg) : recipes

  return (
    <div className="page">
      <header className="masthead">
        <h1>Amma's Recipe Book</h1>
        <Toggle label="Veg only" checked={vegOnly} onChange={setVegOnly} />
      </header>

      <div className="grid">
        {list.map(r => (
          <RecipeCard
            key={r.id}
            title={r.title}
            region={r.region}
            veg={r.veg}
            spice={r.spice}
            minutes={r.minutes}
            onOpen={() => setOpen(r)}
          />
        ))}
      </div>

      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)}>
          <h3>Ingredients</h3>
          <IngredientList items={open.ingredients} />
          <h3>Method</h3>
          <ol>
            {open.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </Modal>
      )}
    </div>
  )
}
