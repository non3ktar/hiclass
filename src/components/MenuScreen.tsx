import { useState } from 'react'
import { curriculum, type Grade, type Lesson } from '../data/curriculum'
import styles from './MenuScreen.module.css'

interface MenuScreenProps {
  onSelectLesson: (lesson: Lesson) => void
}

export default function MenuScreen({ onSelectLesson }: MenuScreenProps): React.JSX.Element {
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)

  return (
    <div className={styles.container}>
      {!selectedGrade ? (
        <>
          <h2 className={styles.title}>Qual o seu ano escolar? 🎒</h2>
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
