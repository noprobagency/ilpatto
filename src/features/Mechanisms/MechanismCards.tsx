/*
 * The 3 mechanism cards (PRD §7) — part of the ritual: reread them, then Ship.
 * Texts are the PRD's verbatim copy. Card 1 injects the user's se-allora pact
 * dynamically. A premium scroll-snap carousel (swipe / trackpad / dots).
 */

import { useRef, useState } from 'react'
import { pactDisplay } from '../../lib/types'
import type { Patto } from '../../lib/types'
import styles from './MechanismCards.module.css'

interface Mechanism {
  title: string
  body: string
  injectPact?: boolean
}

const MECHANISMS: Mechanism[] = [
  {
    title: 'Il segnale, non la voglia',
    body: "Non aspettare la motivazione. Aggancia il gesto a qualcosa che fai già ogni giorno. È il segnale che tira l'azione, non la forza di volontà.",
    injectPact: true,
  },
  {
    title: 'Il minimo conta come tutto',
    body: 'Oggi non devi farlo bene. Devi solo farlo. Una riga, dieci minuti, un piccolo passo: vale come un giorno pieno. La costanza batte l’intensità. Premi Ship anche per il gesto più piccolo.',
  },
  {
    title: 'Sei già chi stai diventando',
    body: 'Ogni Ship è una prova che sei uno che va avanti. Non lo stai dimostrando agli altri: lo stai diventando tu. Il percorso conta più del risultato di oggi.',
  },
]

export default function MechanismCards({ patto }: { patto: Patto }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement
      const cc = c.offsetLeft + c.offsetWidth / 2
      const dist = Math.abs(cc - center)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    if (best !== active) setActive(best)
  }

  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    const c = el.children[i] as HTMLElement | undefined
    if (!c) return
    el.scrollTo({
      left: c.offsetLeft - (el.clientWidth - c.clientWidth) / 2,
      behavior: 'smooth',
    })
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Rileggi, poi spedisci</span>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={handleScroll}
        role="group"
        aria-label="I 3 meccanismi"
      >
        {MECHANISMS.map((m, i) => (
          <article key={i} className={styles.card} aria-roledescription="slide">
            <span className={styles.kicker}>
              <span className={styles.kickerDot} aria-hidden="true" />
              Meccanismo {i + 1}
            </span>
            <h2 className={styles.title}>{m.title}</h2>
            <p className={styles.body}>{m.body}</p>
            {m.injectPact && (
              <p className={styles.pactCallout}>
                Tu hai un patto: <em>{pactDisplay(patto)}</em>
              </p>
            )}
          </article>
        ))}
      </div>

      <div className={styles.dots}>
        {MECHANISMS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={styles.dot}
            aria-label={`Vai al meccanismo ${i + 1}`}
            aria-current={i === active}
            onClick={() => goTo(i)}
          >
            <span
              className={`${styles.dotInner} ${i === active ? styles.dotInnerActive : ''}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
