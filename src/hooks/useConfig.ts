import { useState, useEffect } from 'react'

export interface ConfigData {
  aiName: string
  systemPrompt: string
  baseUrl: string
  apiKey: string
  modelName: string
}

interface UseConfigReturn {
  config: ConfigData | null
  loading: boolean
  error: string | null
  setConfig: (config: ConfigData) => void
}

export const DEFAULT_CONFIG: ConfigData = {
  aiName: 'Kitten',
  systemPrompt:
    'You are a friendly cat helping a young child learn English. Keep it simple, sweet, and fun. Respond in short, simple sentences.',
  baseUrl: import.meta.env.DEV ? '/api/openrouter/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: '',
  modelName: 'meta-llama/llama-3.3-70b-instruct:free'
}

export function useConfig(): UseConfigReturn {
  const [config, setConfigState] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const error: string | null = null

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hikid-config-v2')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge to ensure no empty critical fields (like apiKey from old tests)
        const loadedApiKey = parsed.apiKey?.trim() || DEFAULT_CONFIG.apiKey
        setConfigState({
          aiName: parsed.aiName || DEFAULT_CONFIG.aiName,
          systemPrompt: parsed.systemPrompt || DEFAULT_CONFIG.systemPrompt,
          baseUrl: parsed.baseUrl || DEFAULT_CONFIG.baseUrl,
          apiKey: loadedApiKey,
          modelName: parsed.modelName || DEFAULT_CONFIG.modelName,
        })
      } else {
        setConfigState(DEFAULT_CONFIG)
      }
    } catch (err) {
      setConfigState(DEFAULT_CONFIG)
    } finally {
      setLoading(false)
    }
  }, [])

  const setConfig = (newConfig: ConfigData) => {
    setConfigState(newConfig)
    localStorage.setItem('hikid-config-v2', JSON.stringify(newConfig))
  }

  return { config, loading, error, setConfig }
}
