/*
 * A whole number that animates fluidly when it changes (the day counter ticking
 * up on Ship). Honours prefers-reduced-motion by snapping instantly.
 */

import { useEffect } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { EASE } from '../lib/motion'

interface AnimatedNumberProps {
  value: number
  className?: string
}

export default function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => String(Math.round(v)))

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: reduce ? 0 : 0.5,
      ease: EASE,
    })
    return () => controls.stop()
  }, [value, reduce, mv])

  return <motion.span className={className}>{text}</motion.span>
}
