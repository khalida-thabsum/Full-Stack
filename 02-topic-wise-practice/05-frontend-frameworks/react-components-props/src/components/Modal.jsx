// A reusable dialog: the title comes from a prop and the body from "children"
export default function Modal({ title, onClose, children }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
