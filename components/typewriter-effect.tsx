"use client"

import { useState, useEffect } from "react"

interface TypewriterEffectProps {
  prompts: string[]
  className?: string
}

export function TypewriterEffect({ prompts, className = "" }: TypewriterEffectProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentPrompt = prompts[currentPromptIndex]

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false)
          setIsDeleting(true)
          return
        }

        if (isDeleting) {
          setCurrentText(currentPrompt.substring(0, currentText.length - 1))

          if (currentText === "") {
            setIsDeleting(false)
            setCurrentPromptIndex((prev) => (prev + 1) % prompts.length)
          }
        } else {
          setCurrentText(currentPrompt.substring(0, currentText.length + 1))

          if (currentText === currentPrompt) {
            setIsPaused(true)
          }
        }
      },
      isDeleting ? 50 : isPaused ? 2000 : 100,
    )

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, isPaused, currentPromptIndex, prompts])

  return <span className={`typewriter ${className}`}>{currentText}</span>
}
