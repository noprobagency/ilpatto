/*
 * Onboarding (v1.1) — lean. Three light steps, no wall of fields:
 *   1. Name
 *   2. The pact — a single FREE-TEXT field (the user writes it in their own
 *      words), with a fixed reminder that the goal isn't reaching day 14, it's
 *      starting.
 *   3. The seal: summary + the honest warning + "Sigillo il patto".
 *
 * (The old "Se ___ / allora ___" split and the optional "why" page are gone.)
 * Tone: "io sono uno che spedisce", not "obbedisci o perdi".
 */

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { SealInput } from '../../lib/types'
import { EASE } from '../../lib/motion'
import styles from './Onboarding.module.css'

const STEP_COUNT = 3

interface OnboardingProps {
  onSeal: (input: SealInput) => void
}

export default function Onboarding({ onSeal }: OnboardingProps) {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [protocolName, setProtocolName] = useState('Il Patto')
  const [pactText, setPactText] = useState('')

  const pactReady = pactText.trim().length > 0
  const canAdvance = step === 1 ? pactReady : true

  const move = (dir: 1 | -1) => {
    setDirection(dir)
    setStep((s) => Math.min(STEP_COUNT - 1, Math.max(0, s + dir)))
  }
  const next = () => canAdvance && move(1)
  const back = () => move(-1)
  const seal = () => onSeal({ protocolName, pactText })

  // Enter advances on single-line steps; the pact textarea keeps Enter for newlines.
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (step < STEP_COUNT - 1) next()
    else seal()
  }

  const variants = {
    initial: { opacity: 0, x: reduce ? 0 : direction * 28 },
    animate: { opacity: 1, x: 0 },
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.progress} aria-hidden="true">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span key={i} className={styles.segment}>
              <span
                className={styles.segmentFill}
                style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
              />
            </span>
          ))}
        </div>

        <motion.div
          key={step}
          initial={variants.initial}
          animate={variants.animate}
          transition={{ duration: 0.28, ease: EASE }}
          className={styles.step}
        >
          <span className={styles.kicker}>
            Passo {step + 1} di {STEP_COUNT}
          </span>

          {step === 0 && (
            <>
              <h1 className={styles.title}>Come si chiama il tuo patto?</h1>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="protocolName">
                  Nome del protocollo
                </label>
                <input
                  id="protocolName"
                  className={styles.input}
                  value={protocolName}
                  onChange={(e) => setProtocolName(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={(e) => e.target.select()}
                  maxLength={40}
                  autoFocus
                />
              </div>
              <p className={styles.micro}>
                Un nome è già un impegno. Tieni «Il Patto» o scegline uno tuo —
                «Indie 14», «Ship Daily».
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className={styles.title}>Scrivi il tuo patto</h1>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="pactText">
                  L'impegno con te stesso
                </label>
                <textarea
                  id="pactText"
                  className={`${styles.input} ${styles.textarea}`}
                  value={pactText}
                  onChange={(e) => setPactText(e.target.value)}
                  placeholder="Ogni giorno, per 14 giorni, io… (anche solo 10 minuti)"
                  maxLength={280}
                  rows={3}
                  autoFocus
                />
              </div>
              <p className={styles.reminder}>
                Ricorda: l'obiettivo non è arrivare a 14 giorni. È iniziare. A 14
                giorni non hai costruito l'abitudine — hai superato la parte in cui
                la maggior parte molla. Il vero percorso comincia lì.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className={styles.title}>Sigilla il patto</h1>
              <div className={styles.summary}>
                <span className={styles.summaryName}>
                  {protocolName.trim() || 'Il Patto'}
                </span>
                <p className={styles.summaryPact}>{pactText.trim()}</p>
              </div>
              <p className={styles.warning}>
                <span className={styles.warnDot} aria-hidden="true" />
                <span>
                  <strong>14 giorni.</strong> Ogni giorno rileggi i meccanismi e
                  premi Ship. Salti un giorno e il percorso si chiude.
                </span>
              </p>
            </>
          )}

          {step < STEP_COUNT - 1 ? (
            <div className={styles.nav}>
              {step > 0 ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={back}
                >
                  Indietro
                </button>
              ) : (
                <span className={styles.spacer} />
              )}
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={next}
                disabled={!canAdvance}
              >
                Avanti
              </button>
            </div>
          ) : (
            <div className={styles.step}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSeal}`}
                onClick={seal}
                autoFocus
              >
                Sigillo il patto
              </button>
              <div className={styles.nav} style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={back}
                >
                  Indietro
                </button>
                <span className={styles.spacer} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
