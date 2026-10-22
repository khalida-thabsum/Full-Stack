// Controlled input: the parent owns "checked" and passes a setter as onChange
export default function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="track"><span className="knob" /></span>
      {label}
    </label>
  )
}
