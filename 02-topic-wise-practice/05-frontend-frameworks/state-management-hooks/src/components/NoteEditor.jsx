import { useState, useId } from 'react'

const LIMIT = 200

export default function NoteEditor({ onSave }) {
  const [text, setText] = useState('')
  const id = useId() // unique id that links the label to the textarea

  function save() {
    if (!text.trim()) return
    onSave(text.trim())
    setText('')
  }

  return (
    <div className="editor">
      <label htmlFor={id}>New note</label>
      <textarea
        id={id}
        value={text}
        maxLength={LIMIT}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) save() }}
        placeholder="Write something... (Ctrl + Enter to save)"
      />
      <div className="editor-foot">
        <span className={text.length > LIMIT - 20 ? 'count warn' : 'count'}>{text.length}/{LIMIT}</span>
        <button onClick={save} disabled={!text.trim()}>Add note</button>
      </div>
    </div>
  )
}
