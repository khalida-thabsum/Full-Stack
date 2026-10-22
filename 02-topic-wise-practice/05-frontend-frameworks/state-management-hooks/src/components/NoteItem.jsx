import { useState, useRef, useEffect } from 'react'

export default function NoteItem({ note, dispatch }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const inputRef = useRef(null)

  // When edit mode starts, focus the input and select its text
  useEffect(() => {
    if (editing) inputRef.current.select()
  }, [editing])

  function finish() {
    if (draft.trim()) dispatch({ type: 'edit', id: note.id, text: draft.trim() })
    else setDraft(note.text)
    setEditing(false)
  }

  return (
    <li className={note.pinned ? 'note pinned' : 'note'}>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={finish}
          onKeyDown={e => {
            if (e.key === 'Enter') finish()
            if (e.key === 'Escape') { setDraft(note.text); setEditing(false) }
          }}
        />
      ) : (
        <p onDoubleClick={() => setEditing(true)} title="Double-click to edit">{note.text}</p>
      )}
      <div className="actions">
        <small>{new Date(note.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small>
        <button onClick={() => dispatch({ type: 'togglePin', id: note.id })}>{note.pinned ? 'Unpin' : 'Pin'}</button>
        <button onClick={() => setEditing(true)}>Edit</button>
        <button className="danger" onClick={() => dispatch({ type: 'delete', id: note.id })}>Delete</button>
      </div>
    </li>
  )
}
