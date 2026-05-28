export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Agora vamos usar o Google Gemini diretamente, que tem um plano gratuito gigante e não dá erro 429!
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Por favor, crie a variável GEMINI_API_KEY no Netlify." }), { status: 500 });
  }

  try {
    const bodyText = await req.text();
    const bodyJson = JSON.parse(bodyText);
    
    // O frontend manda as mensagens no formato da OpenRouter.
    // Precisamos converter para o formato do Google Gemini.
    let systemInstructionText = "You are a friendly cat helping a young child learn English.";
    const geminiContents = [];

    for (const msg of bodyJson.messages) {
      if (msg.role === "system") {
        systemInstructionText = msg.content;
      } else {
        // Gemini usa "user" e "model" em vez de "user" e "assistant"
        const role = msg.role === "assistant" ? "model" : "user";
        geminiContents.push({
          role: role,
          parts: [{ text: msg.content }]
        });
      }
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
      }
    };
    
    // Vamos usar o gemini-2.5-flash que é super rápido e gratuito!
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Erro no Gemini" }), { status: response.status });
    }

    // Agora precisamos converter a resposta do Gemini de volta para o formato que o frontend espera (OpenRouter/OpenAI)
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Miau... I didn't understand.";

    const openRouterFormatReply = {
      choices: [
        {
          message: {
            role: "assistant",
            content: replyText
          }
        }
      ]
    };
    
    return new Response(JSON.stringify(openRouterFormatReply), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error in Netlify Function" }), { status: 500 });
  }
};
