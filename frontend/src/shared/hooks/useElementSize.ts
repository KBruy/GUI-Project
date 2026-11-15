// Mierzy element i odświeża rozmiar, gdy się zmieni (np. przy zmianie rozmiaru okna).
// Potrzebne dla canvasu, bo Konva dostaje szerokość i wysokość w pikselach, a nie w CSS.
import { useEffect, useRef, useState } from 'react'

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}
