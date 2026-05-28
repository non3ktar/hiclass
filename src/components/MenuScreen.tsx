import { useState } from 'react'
import { curriculum, type Grade, type Lesson } from '../data/curriculum'
import styles from './MenuScreen.module.css'

interface MenuScreenProps {
  onSelectLesson: (lesson: Lesson) => void
}

export default function MenuScreen({ onSelectLesson }: MenuScreenProps): React.JSX.Element {
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [showHowToUse, setShowHowToUse] = useState(false)

  return (
    <div className={styles.container}>
      {!selectedGrade ? (
        <>
          <h2 className={styles.title}>Qual o seu ano escolar? 🎒</h2>
          
          <div className={styles.howToUseWrapper}>
            <button 
              className={styles.howToUseBtn} 
              onClick={() => setShowHowToUse(!showHowToUse)}
              type="button"
            >
              {showHowToUse ? '📖 Ocultar Instruções' : '📖 Como Usar? (Clique aqui)'}
            </button>
            
            {showHowToUse && (
              <div className={styles.howToUseCard}>
                <h3>Bem-vindo à sua aula de Inglês falada! 🐱</h3>
                <p>Aqui você vai treinar inglês conversando com um gatinho super esperto!</p>
                <ol>
                  <li><strong>1º Passo:</strong> Escolha o seu ano escolar abaixo.</li>
                  <li><strong>2º Passo:</strong> Escolha qual lição você quer treinar hoje.</li>
                  <li><strong>3º Passo:</strong> Quando a tela do gatinho abrir, você pode segurar o <strong>botão de Microfone</strong> 🎤 para falar em inglês, ou ativar o <strong>botão "Chat"</strong> no canto superior direito para digitar ⌨️.</li>
                  <li><strong>Lembre-se:</strong> Não tenha vergonha de errar! O gatinho está aqui para te ajudar. Divirta-se!</li>
                </ol>
              </div>
            )}
          </div>

          <div className={styles.grid}>
            {curriculum.map(grade => (
              <button
                key={grade.id}
                className={styles.card}
                style={{ '--theme-color': grade.color } as React.CSSProperties}
                onClick={() => setSelectedGrade(grade)}
                type="button"
              >
                <span className={styles.cardTitle}>{grade.title}</span>
                <span className={styles.cardSubtitle}>{grade.lessons.length} Lições</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={styles.headerRow}>
            <button className={styles.backBtn} onClick={() => setSelectedGrade(null)} type="button">
              ← Voltar
            </button>
            <h2 className={styles.title}>{selectedGrade.title}</h2>
          </div>
          <div className={styles.lessonList}>
            {selectedGrade.lessons.map(lesson => (
              <button
                key={lesson.id}
                className={styles.lessonCard}
                onClick={() => onSelectLesson(lesson)}
                type="button"
              >
                <div className={styles.lessonIcon}>{lesson.icon}</div>
                <div className={styles.lessonInfo}>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
