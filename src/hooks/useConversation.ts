import { useState, useCallback, useRef } from 'react'
import { type KittenState, type ChatMessage } from '@renderer/types/conversation'
import { useConfig } from './useConfig'

type Mode = 'press-and-hold' | 'vad'

const MODE_KEY = 'hikid-mode'

function loadMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    if (saved === 'vad' || saved === 'press-and-hold') return saved
  } catch {
    // ignore
  }
  return 'press-and-hold'
}

function saveMode(mode: Mode): void {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    // ignore
  }
}

export interface UseConversationReturn {
  kittenState: KittenState
  isRecording: boolean
  isProcessing: boolean
  messages: ChatMessage[]
  servicesReady: boolean
  error: string | null
  mode: Mode
  startRecording: () => void
  stopRecording: () => void
  interrupt: () => void
  setMode: (mode: Mode) => void
  clearError: () => void
  clearMessages: () => void
  addSystemMessage: (text: string) => void
  sendMessage: (text: string) => Promise<void>
}

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useConversation(overrideSystemPrompt?: string): UseConversationReturn {
  const [kittenState, setKittenState] = useState<KittenState>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const servicesReady = true // PWA is always ready
  const [error, setError] = useState<string | null>(null)
  const [mode, setModeState] = useState<Mode>(loadMode)

  const recognitionRef = useRef<any>(null)
  const currentTextRef = useRef<string>('')
  const messagesRef = useRef<ChatMessage[]>([])

  // Keep ref in sync
  if (messagesRef.current !== messages) {
    messagesRef.current = messages
  }

  const interrupt = useCallback(() => {
    window.speechSynthesis.cancel()
    setKittenState('idle')
    setIsProcessing(false)
  }, [])

  const speakText = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        resolve()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices()
      const femaleVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices.find(v => v.lang.includes('en'))
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.2

      utterance.onstart = () => {
        setKittenState('speaking')
      }

      utterance.onend = () => {
        setKittenState('idle')
        resolve()
      }

      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e)
        setKittenState('idle')
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const { config } = useConfig()

  const sendMessageToAI = useCallback(async (text: string, currentMessages: ChatMessage[]) => {
    if (!config) return
    setIsProcessing(true)
    setKittenState('thinking')
    
    // Add placeholder for assistant
    setMessages(prev => [...prev, { role: 'assistant', text: '', pending: true } as ChatMessage])

    try {
      // Build conversation history
      const history = currentMessages.filter(m => !m.pending && m.role !== 'system').map(m => ({
        role: m.role,
        content: m.text
      }))

      const activeSystemPrompt = overrideSystemPrompt || config.systemPrompt

      const response = await fetch(config.baseUrl.trim(), {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'HTTP-Referer': window.location.href, // OpenRouter recommends the actual site URL
          'X-Title': 'HiKid PWA', 
        },
        body: JSON.stringify({
          model: config.modelName,
          messages: [
            { role: 'system', content: activeSystemPrompt },
            ...history,
            { role: 'user', content: text }
          ],
          stream: false
        })
      })

      const errData = await response.text()
      if (!response.ok) {
        console.error('OpenRouter Error:', response.status, errData)
        // Try to parse errData to get a cleaner message
        let cleanErr = errData
        try {
          const parsed = JSON.parse(errData)
          if (parsed.error && parsed.error.message) {
            cleanErr = parsed.error.message
          }
        } catch { }
        throw new Error(`Erro na API (${response.status}): ${cleanErr}`)
      }

      const data = JSON.parse(errData)
      if (data.error) {
         console.error('OpenRouter JSON Error:', data.error)
         throw new Error(`Erro: ${data.error.message || 'Desconhecido'}`)
      }

      const aiResponseText = data.choices?.[0]?.message?.content || "Oops, I didn't get that!"

      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = { role: 'assistant', text: aiResponseText, pending: false } as ChatMessage
        return newMessages
      })

      await speakText(aiResponseText)

    } catch (err) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(`Erro de Conexão: ${errorMsg}`)
      setKittenState('idle')
      // Remove the pending assistant message
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].pending) {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsProcessing(false)
    }
  }, [speakText, config])

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US' // Listen for English
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsRecording(true)
        setKittenState('listening')
      }

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        currentTextRef.current = text
        setMessages(prev => [...prev, { role: 'user', text, pending: false } as ChatMessage])
      }

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setError(`Erro de áudio: ${event.error}`)
        }
        setIsRecording(false)
        setKittenState('idle')
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (currentTextRef.current) {
          const text = currentTextRef.current
          // The message was already added in onresult, so we just trigger AI
          sendMessageToAI(text, messagesRef.current)
          currentTextRef.current = ''
        } else {
          setKittenState('idle')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error(err)
      setError('Erro ao iniciar o microfone.')
    }
  }, [sendMessageToAI])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const newMessage = { role: 'user', text, pending: false } as ChatMessage
    setMessages(prev => [...prev, newMessage])
    sendMessageToAI(text, [...messagesRef.current, newMessage])
  }, [sendMessageToAI])

  const setMode = useCallback((next: Mode) => {
    if (next === mode) return
    stopRecording()
    interrupt()
    setModeState(next)
    saveMode(next)
  }, [mode, stopRecording, interrupt])

  const clearError = useCallback(() => setError(null), [])

  const clearMessages = useCallback(() => {
    setMessages([])
    interrupt()
  }, [interrupt])

  const addSystemMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'system', text } as ChatMessage])
  }, [])

  return {
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
  }
}
