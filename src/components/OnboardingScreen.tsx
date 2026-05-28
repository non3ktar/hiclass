import Kitten from '@renderer/components/Kitten'
import styles from './OnboardingScreen.module.css'

interface OnboardingScreenProps {
  onStart: () => void
  aiName?: string
}

export default function OnboardingScreen({
  onStart,
  aiName = 'HiKid'
}: OnboardingScreenProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.kittenWrapper}>
        <Kitten state="idle" />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>Oi! Eu sou o {aiName}! 🐱</h2>
        <p className={styles.subtitle}>Seu novo amigo para treinar Inglês!</p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🎙️</span>
            <span className={styles.stepText}>
              <strong>Aperte e segure</strong> o botão de microfone para falar comigo.
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>✋</span>
            <span className={styles.stepText}>
              <strong>Solte o botão</strong> quando terminar de falar, e eu vou te responder!
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>💡</span>
            <span className={styles.stepText}>
              Lá em cima, clique em <strong>"Ideias"</strong> se não souber sobre o que conversar.
            </span>
          </div>
        </div>

        <button className={styles.startBtn} onClick={onStart} type="button">
          Vamos Conversar!
        </button>
      </div>
    </div>
  )
}
