export function notesReducer(notes, action) {
  switch (action.type) {
    case 'add':
      return [{ id: crypto.randomUUID(), text: action.text, pinned: false, createdAt: Date.now() }, ...notes]
    case 'edit':
      return notes.map(n => (n.id === action.id ? { ...n, text: action.text } : n))
    case 'togglePin':
      return notes.map(n => (n.id === action.id ? { ...n, pinned: !n.pinned } : n))
    case 'delete':
      return notes.filter(n => n.id !== action.id)
    default:
      throw new Error(`Unknown action ${action.type}`)
  }
}
