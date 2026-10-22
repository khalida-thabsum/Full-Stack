import { useState, useEffect } from 'react'

// Custom hook: works like useState but keeps the value in localStorage
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage may be full or disabled; the app still works in memory
    }
  }, [key, value])

  return [value, setValue]
}
