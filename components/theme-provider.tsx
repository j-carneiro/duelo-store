"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Remova a importação que termina em /dist/types e use esta:
import { type ThemeProviderProps } from "next-themes" 

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}