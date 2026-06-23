import styles from './App.module.css'

export default function App() {
  return (
    <main className={styles.shell}>
      <span className={styles.harnessTag}>Il Patto</span>
      <div className={styles.card}>
        <p className={styles.pact}>Setup completo.</p>
        <p className={styles.quiet}>Il protocollo di 14 giorni arriva nelle prossime fasi.</p>
      </div>
    </main>
  )
}
