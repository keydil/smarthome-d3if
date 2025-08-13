"use client"
import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"

interface Orb {
  id: number
  size: number
  initialX: number
  initialY: number
  moveX: number
  moveY: number
  duration: number
  colorIndex: number
}

export const BackgroundAnimation = () => {
  const [orbs, setOrbs] = useState<Orb[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const generateOrbs = useCallback((width: number, height: number) => {
    return Array.from({ length: 6 }).map((_, index) => {
      const size = Math.random() * 200 + 100
      const initialX = Math.random() * (width - size)
      const initialY = Math.random() * (height - size)

      // Ensure movement stays within bounds
      const maxMoveX = Math.min(200, width - initialX - size)
      const maxMoveY = Math.min(200, height - initialY - size)
      const minMoveX = Math.max(-200, -initialX)
      const minMoveY = Math.max(-200, -initialY)

      return {
        id: index,
        size,
        initialX,
        initialY,
        moveX: Math.random() * (maxMoveX - minMoveX) + minMoveX,
        moveY: Math.random() * (maxMoveY - minMoveY) + minMoveY,
        duration: Math.random() * 10 + 10,
        colorIndex: Math.floor(Math.random() * 3),
      }
    })
  }, [])

  const handleResize = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    setDimensions({ width, height })
    setOrbs(generateOrbs(width, height))
  }, [generateOrbs])

  useEffect(() => {
    // Initial setup
    handleResize()

    // Add resize listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [handleResize])

  if (orbs.length === 0 || dimensions.width === 0) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />

      {/* Floating Orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute rounded-full mix-blend-multiply filter blur-xl opacity-70 ${
            orb.colorIndex === 0 ? "bg-purple-300" : orb.colorIndex === 1 ? "bg-blue-300" : "bg-indigo-300"
          }`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.initialX,
            top: orb.initialY,
          }}
          animate={{
            x: [0, orb.moveX, 0],
            y: [0, orb.moveY, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: orb.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_100%)]" />
    </div>
  )
}
