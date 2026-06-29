import { useEffect, useRef, useState } from 'react'

export function useUndoAction() {
  const [pending, setPending] = useState(null)
  const timer = useRef(null)
  const commitRef = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const schedule = (message, commit) => {
    if (commitRef.current) commitRef.current()
    clearTimeout(timer.current)
    commitRef.current = commit
    setPending({ message, key: Date.now() })
    timer.current = setTimeout(() => {
      commit()
      commitRef.current = null
      setPending(null)
    }, 5000)
  }

  const undo = () => {
    clearTimeout(timer.current)
    commitRef.current = null
    setPending(null)
  }

  return { pending, schedule, undo }
}
