import { useEffect, useRef, useState } from 'react'
import Kitten from '@renderer/components/Kitten'
import VoiceButton from '@renderer/components/VoiceButton'
import SettingsPanel from '@renderer/components/SettingsPanel'
import TextToggle from '@renderer/components/TextToggle'
import ChatBubbles from '@renderer/components/ChatBubbles'
import IdeasMenu from '@renderer/components/IdeasMenu'
import { useConversation } from '@renderer/hooks/useConversation'
import { t, detectedLocale } from '@shared/i18n'

import MenuScreen from '@renderer/components/MenuScreen'
import { type Lesson } from '@renderer/data/curriculum'

type Screen = 'menu' | 'conversation'

const TEXT_ENABLED_KEY = 'hikid-text-enabled'

function loadTextEnabled(): boolean {
  try {
    const saved = localStorage.getItem(TEXT_ENABLED_KEY)
    return saved === 'true'
  } catch {
    return false
  }
}

function saveTextEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(TEXT_ENABLED_KEY, String(enabled))
  } catch {
    // ignore
  }
}

// Removed onboarded logic

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('menu')
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [textEnabled, setTextEnabled] = useState<boolean>(loadTextEnabled)
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    kittenState,
    isRecording,
    isProcessing,
    messages,
    servicesReady,
    error,
    mode,
    startRecording,
    stopRecording,
    interrupt,
    setMode,
    clearError,
    clearMessages,
    addSystemMessage,
    sendMessage
  } = useConversation(activeLesson?.systemPrompt)

  const aiName = 'HiKid'

  useEffect(() => {
    document.documentElement.lang = detectedLocale === 'zh' ? 'zh-CN' : 'pt-BR'
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!topicDropdownOpen) return
    const handleClick = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTopicDropdownOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [topicDropdownOpen])

  const handleToggleText = (): void => {
    const next = !textEnabled
    setTextEnabled(next)
    saveTextEnabled(next)
  }

  const handleLessonStart = (lesson: Lesson): void => {
    setActiveLesson(lesson)
    setScreen('conversation')
    // Optionally welcome the student
    addSystemMessage(`Você escolheu: ${lesson.title}. Let's go!`)
  }

  const handleBackToMenu = (): void => {
    clearMessages()
    setActiveLesson(null)
    setScreen('menu')
  }

  const handleTopicClick = (topic: string): void => {
    sendMessage(topic).catch((err: unknown) => {
      console.error('Topic send error:', err)
    })
  }

  const handleGameStart = async (game: { rules: string }): Promise<void> => {
    addSystemMessage(game.rules)
    try {
      await sendMessage(game.rules)
    } catch (err) {
      console.error('Game start error:', err)
      addSystemMessage("Oops, the game couldn't start. Let's try again!")
    }
    setTopicDropdownOpen(false)
  }

  const [chatInputValue, setChatInputValue] = useState('')
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputValue.trim()) return
    sendMessage(chatInputValue.trim()).catch(err => console.error(err))
    setChatInputValue('')
  }

  const showVoiceButton = mode === 'press-and-hold'
  const showSidebar = screen === 'conversation' && textEnabled

  function getMicLabel(): string {
    if (isRecording) return t('kitten.listening')
    if (isProcessing || kittenState === 'thinking') return t('kitten.thinking')
    if (kittenState === 'speaking') return t('kitten.speaking')
    if (mode === 'vad') return t('kitten.listening')
    return t('kitten.hold_to_speak')
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <header className="app-header">
          <div className="app-header-left">
            {screen === 'conversation' && (
              <div className="topic-dropdown" ref={dropdownRef}>
                <button
                  className={`topic-dropdown-btn ${topicDropdownOpen ? 'open' : ''}`}
                  onClick={() => setTopicDropdownOpen((prev) => !prev)}
                  type="button"
                  aria-label={t('ui.ideas')}
                  title={t('ui.ideas')}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>{t('ui.ideas')}</span>
                </button>
                {topicDropdownOpen && (
                  <div className="topic-dropdown-panel">
                    <IdeasMenu
                      key={topicDropdownOpen ? 'open' : 'closed'}
                      onTopicClick={(topic) => {
                        handleTopicClick(topic)
                        setTopicDropdownOpen(false)
                      }}
                      onGameStart={handleGameStart}
                    />
                  </div>
                )}
              </div>
            )}
            {screen === 'conversation' && (
              <button className="start-services-btn" onClick={handleBackToMenu} type="button">
                ← Menu
              </button>
            )}
          </div>
          <div className="app-settings">
            {screen === 'conversation' && (
              <>
                <SettingsPanel mode={mode} onModeChange={setMode} />
                <TextToggle enabled={textEnabled} onToggle={handleToggleText} />
              </>
            )}
          </div>
        </header>

        <main className="app-stage">
          {screen === 'conversation' && (
            <>
              <Kitten state={kittenState} />

              {error && (
                <div className="error-toast">
                  <span className="error-toast-text">{error}</span>
                  <button
                    className="error-toast-close"
                    onClick={clearError}
                    type="button"
                    aria-label="Dismiss error"
                  >
                    &times;
                  </button>
                </div>
              )}

              <div className="mic-area">
                {showVoiceButton ? (
                  <>
                    <VoiceButton
                      isRecording={isRecording}
                      onPointerDown={startRecording}
                      onPointerUp={stopRecording}
                      disabled={
                        !servicesReady ||
                        isProcessing ||
                        kittenState === 'thinking' ||
                        kittenState === 'speaking'
                      }
                    />
                    <span className="mic-label">{getMicLabel()}</span>
                  </>
                ) : (
                  <div className="vad-indicator">
                    {(kittenState === 'idle' || kittenState === 'listening') && (
                      <span className="vad-dot" />
                    )}
                    {(isProcessing || kittenState === 'thinking') && (
                      <span className="thinking-spinner" aria-hidden="true" />
                    )}
                    {kittenState === 'speaking' && (
                      <span className="speaking-wave" aria-hidden="true" />
                    )}
                    <span className="mic-label">{getMicLabel()}</span>
                  </div>
                )}
              </div>

              {messages.length > 0 && (
                <div className="messages-badge">
                  <span className="messages-count">{messages.length}</span>
                  <span className="messages-label">{t('ui.messages')}</span>
                  <button
                    className="messages-clear-btn"
                    onClick={clearMessages}
                    type="button"
                    aria-label="Clear conversation"
                    title="Clear conversation"
                  >
                    ×
                  </button>
                </div>
              )}
            </>
          )}

          {screen === 'menu' && (
            <MenuScreen onSelectLesson={handleLessonStart} />
          )}
        </main>

        <footer className="status-bar">
          <div className="status-bar-info">
            <span
              className={`status-dot ${servicesReady ? 'ready' : ''} ${error ? 'error' : ''}`}
              aria-hidden="true"
            />
            <span>{t('status.ready')}</span>
            <span className="school-info"> • Escola Januário E. de Lima • Inglês • Profª Deisiane Belém</span>
          </div>
          {kittenState === 'speaking' && (
            <button className="interrupt-btn" onClick={interrupt} type="button">
              {t('ui.stop')}
            </button>
          )}
        </footer>
      </div>

      {showSidebar && (
        <aside className="chat-sidebar">
          <ChatBubbles messages={messages} visible aiName={aiName} />
          <form className="chat-input-form" onSubmit={handleChatSubmit}>
            <input
              type="text"
              className="chat-input"
              value={chatInputValue}
              onChange={e => setChatInputValue(e.target.value)}
              placeholder="Type your message..."
            />
            <button type="submit" className="chat-submit-btn" disabled={!chatInputValue.trim() || isProcessing}>
              Send
            </button>
          </form>
        </aside>
      )}
    </div>
  )
}

export default App
