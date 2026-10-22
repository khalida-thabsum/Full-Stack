import { useReducer, useEffect, useMemo, useRef, useState } from 'react'
import useLocalStorage from './hooks/useLocalStorage'
import { notesReducer } from './notesReducer'
import NoteEditor from './components/NoteEditor'
import NoteItem from './components/NoteItem'

const starter = [
  { id: 'welcome', text: 'Welcome! Press Ctrl + K to jump to search.', pinned: true, createdAt: Date.now() }
]

export default function App() {
  // Saved copy lives in localStorage; the reducer works on it in memory
  const [saved, setSaved] = useLocalStorage('notes', starter)
  const [notes, dispatch] = useReducer(notesReducer, saved)
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  // Keep localStorage in sync whenever notes change
  useEffect(() => { setSaved(notes) }, [notes, setSaved])

  // Keyboard shortcut: Ctrl/Cmd + K focuses the search box
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey) // cleanup
  }, [])

  // Pinned notes first, then newest; filtered by the search text
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter(n => n.text.toLowerCase().includes(q))
      .sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt))
  }, [notes, query])

  return (
    <div className="app">
      <h1>Notes</h1>
      <NoteEditor onSave={text => dispatch({ type: 'add', text })} />
      <input
        ref={searchRef}
        className="search"
        placeholder="Search notes (Ctrl + K)"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <p className="meta">{visible.length} of {notes.length} notes</p>
      <ul className="notes">
        {visible.map(n => (
          <NoteItem key={n.id} note={n} dispatch={dispatch} />
        ))}
      </ul>
    </div>
  )
}
