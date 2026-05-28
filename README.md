# HiKid PWA - Seu Amigo de Inglês com IA 🐱

Uma adaptação do projeto HiKid (originalmente feito em Electron) para um **PWA Web App** leve, focado em rodar em dispositivos móveis (Android) e em navegadores web. Ideal para crianças praticarem conversação em inglês de forma interativa.

## 🚀 Tecnologias (Tech Stack)
- **Frontend**: React + Vite + Typescript
- **Estilização**: CSS puro (`main.css`)
- **PWA**: `vite-plugin-pwa` para instalação no Android/Chrome.
- **Microfone/Áudio (STT)**: Web Speech API (`SpeechRecognition`).
- **Fala da IA (TTS)**: Web Speech API (`speechSynthesis`).
- **Cérebro (LLM)**: Integração com OpenRouter (modelo `qwen/qwen-2.5-72b-instruct`).

## 🛠️ Como Instalar e Rodar
1. Certifique-se de ter o Node.js instalado.
2. Acesse a pasta do projeto e instale as dependências:
   ```bash
   npm install
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. **Deploy**: Para usar na escola, basta fazer o deploy dessa pasta na Vercel ou Cloudflare Pages (`npm run build`). Depois, peça para os alunos abrirem o link no Chrome do celular e clicarem em "Adicionar à Tela Inicial".

## 📝 Histórico de Modificações
- Remoção completa do backend Electron (`@mariozechner/pi-agent-core`).
- Substituição do motor de TTS local (Ollama/espeak) por `window.speechSynthesis`.
- Substituição do motor de STT por `window.SpeechRecognition`.
- Integração da IA (LLM) modificada para bater na API da OpenRouter.
- Tradução completa da interface e das notificações de erro para `pt-BR`.
- Conversão da estrutura Vite para gerar Manifest e Service Workers de PWA.

## 🎯 Objetivo do Projeto
Fornecer um ambiente sem atrito e sem necessidade de instalação pesada para que alunos do Ensino Fundamental possam praticar inglês com um tutor simpático.
