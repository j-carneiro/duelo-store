// components/ThemeToggle.tsx
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita erro de hidratação (espera o componente montar no navegador)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="p-2 w-9 h-9" /> // Espaço vazio enquanto carrega

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 bg-white/5 border border-white/10 rounded-sm hover:bg-white hover:text-[#2D3E77] transition-all text-white dark:text-yellow-400"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}