import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    // Luôn chạy kể cả target = 0
    if (target === prevTarget.current) return
    prevTarget.current = target

    let start = 0
    const end = Number(target) || 0
    if (end === 0) { setCount(0); return }

    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}
