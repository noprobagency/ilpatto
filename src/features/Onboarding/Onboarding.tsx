/*
 * Onboarding (PRD §6.1, §2). A few light steps — never a wall of fields:
 *   1. Protocol name
 *   2. The pact in if-then form (the single biggest lever — implementation
 *      intentions), with the sentence forming live
 *   3. Why / identity framing (optional, one line)
 *   4. The seal: summary + the honest warning + "Sigillo il patto"
 *
 * Tone: "io sono uno che spedisce", not "obbedisci o perdi" (PRD §2).
 */

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { SealInput } from '../../lib/types'
import styles from './Onboarding.module.css'

const STEP_COUNT = 4

interface OnboardingProps {
  onSeal: (input: SealInput) => void
}

export default function Onboarding({ onSeal }: OnboardingProps) {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [protocolName, setProtocolName] = useState('Il Patto')
  const [trigger, setTrigger] = useState('')
  const [action, setAction] = useState('')
  const [why, setWhy] = useState('')

  const pactReady = trigger.trim().length > 0 && action.trim().length > 0
  const canAdvance = step === 1 ? pactReady : true

  const move = (dir: 1 | -1) => {
    setDirection(dir)
    setStep((s) => Math.min(STEP_COUNT - 1, Math.max(0, s + dir)))
  }
  const next = () => canAdvance && move(1)
  const back = () => move(-1)
  const seal = () =>
    onSeal({
      protocolName,
      trigger,
      action,
      ...(why.trim() ? { why: why.trim() } : {}),
    })

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (step < STEP_COUNT - 1) next()
    else seal()
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
          initial={{ opacity: 0, x: reduce ? 0 : direction * 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
                <h1 className={styles.title}>Scrivi il tuo impegno</h1>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="trigger">
                    Se…
                  </label>
                  <input
                    id="trigger"
                    className={styles.input}
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="apro il laptop la mattina"
                    maxLength={80}
                    autoFocus
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="action">
                    allora…
                  </label>
                  <input
                    id="action"
                    className={styles.input}
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="scrivo una riga di codice"
                    maxLength={80}
                  />
                </div>
                <p className={styles.preview}>
                  Se{' '}
                  {trigger.trim() ? (
                    <em>{trigger.trim()}</em>
                  ) : (
                    <span className={styles.previewPlaceholder}>…</span>
                  )}
                  , allora{' '}
                  {action.trim() ? (
                    <em>{action.trim()}</em>
                  ) : (
                    <span className={styles.previewPlaceholder}>…</span>
                  )}
                  .
                </p>
                <p className={styles.micro}>
                  Aggancia il gesto a un segnale fisso che hai già ogni giorno. È il
                  segnale a tirare l'azione — non la voglia.
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className={styles.title}>Perché lo fai?</h1>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="why">
                    Chi vuoi diventare <span style={{ fontWeight: 400 }}>(facoltativo)</span>
                  </label>
                  <input
                    id="why"
                    className={styles.input}
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="uno che spedisce, ogni giorno"
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <p className={styles.micro}>
                  Una riga. Non un risultato da raggiungere: un'identità da abitare.
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className={styles.title}>Sigilla il patto</h1>
                <div className={styles.summary}>
                  <span className={styles.summaryName}>
                    {protocolName.trim() || 'Il Patto'}
                  </span>
                  <p className={styles.summaryPact}>
                    Se <em>{trigger.trim()}</em>, allora <em>{action.trim()}</em>.
                  </p>
                  {why.trim() && (
                    <p className={styles.summaryWhy}>« {why.trim()} »</p>
                  )}
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

            {/* Per-step navigation */}
            {step < 3 ? (
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
