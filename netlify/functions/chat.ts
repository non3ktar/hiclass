export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // A chave de API agora fica escondida no painel do Netlify
  const API_KEY = process.env.OPENROUTER_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Chave de API ausente no servidor (Netlify Environment Variables)" }), { status: 500 });
  }

  try {
    // Pegamos o corpo da requisição enviada pelo frontend
    const bodyText = await req.text();
    const bodyJson = JSON.parse(bodyText);
    
    // Se o professor definir um modelo específico no Netlify, usamos ele. 
    // Caso contrário, mantemos o que o frontend enviou.
    const customModel = process.env.OPENROUTER_MODEL;
    if (customModel && customModel.trim() !== "") {
      bodyJson.model = customModel.trim();
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://hiclass.netlify.app", 
        "X-Title": "HiKid PWA",
      },
      body: JSON.stringify(bodyJson),
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
