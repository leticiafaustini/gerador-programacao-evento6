require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TIPOS_VALIDOS = ['abertura', 'louvor', 'oracao', 'mensagem', 'dinamica', 'intervalo', 'encerramento'];

app.post('/api/gerar-programacao', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY não configurada. Copie .env.example para .env e preencha sua chave.');
      return res.status(500).json({ error: 'Servidor não configurado: falta a chave de API. Veja o README.md.' });
    }

    const { tema, versiculo, publico, tipo, duracao, formato, lead } = req.body || {};

    if (!tema || !publico || !tipo || !duracao || !formato) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    // Log leve para acompanhar geração de leads no console do servidor (opcional).
    if (lead && lead.email) {
      console.log(`[lead] ${lead.nome} <${lead.email}> — ${lead.igreja} — gerou programação: "${tema}"`);
    }

    const prompt = `Você é um assistente especialista em organizar programações de eventos cristãos (cultos, conferências, retiros).
Gere uma programação de evento completa com as seguintes características:
- Tipo de evento: ${tipo}
- Tema: ${tema}
- Versículo-base: ${versiculo || 'não informado'}
- Público: ${publico}
- Duração total: ${duracao}
- Formato: ${formato}
- Nome da igreja/ministério (para personalizar o kit de divulgação): ${(lead && lead.igreja) || 'não informado'}

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, sem markdown, no seguinte formato exato:
{
  "titulo_evento": "string curta e criativa para o evento, baseada no tema",
  "blocos": [
    {
      "inicio": "HH:MM",
      "fim": "HH:MM",
      "tipo": "abertura|louvor|oracao|mensagem|dinamica|intervalo|encerramento",
      "titulo": "string curta",
      "descricao": "string com no máximo 18 palavras, prática e específica ao tema",
      "checklist": ["item de material ou responsável necessário para este bloco, no máximo 3 itens curtos"],
      "sugestao_musical": "apenas para blocos do tipo louvor: descreva o ESTILO/tema musical sugerido (ex: 'louvor de adoração lenta, foco em rendição', 'músicas animadas de celebração e gratidão'). NUNCA cite nomes de músicas, artistas ou trechos de letras reais — apenas a direção estilística. Para os demais tipos de bloco, omita este campo ou deixe string vazia."
    }
  ],
  "kit_divulgacao": {
    "post_instagram": "legenda pronta para post de Instagram convidando para o evento, tom envolvente, com 1-2 emojis, até 60 palavras, mencionando o nome da igreja/ministério se informado",
    "convite_whatsapp": "mensagem curta e calorosa para enviar em grupos de WhatsApp convidando para o evento, até 40 palavras"
  },
  "calendario_editorial": [
    {
      "quando": "string curta indicando o momento relativo ao evento, ex: '7 dias antes', '3 dias antes', '1 dia antes', 'Dia do evento', '1 dia depois'",
      "plataforma": "Instagram Feed | Instagram Stories | WhatsApp | Facebook",
      "formato": "string curta do tipo de conteúdo, ex: 'Teaser em vídeo', 'Card de convite', 'Contagem regressiva', 'Cobertura ao vivo', 'Recap/agradecimento'",
      "ideia": "string com até 25 palavras descrevendo a ideia de conteúdo para esse momento, específica ao tema do evento"
    }
  ]
}
Gere entre 5 e 6 itens no calendario_editorial, cobrindo do início da divulgação até um recap após o evento, em ordem cronológica.
Comece o horário em 19:00 caso não haja indicação contrária. Distribua os blocos de forma realista para a duração total informada, incluindo abertura e encerramento. Use no máximo 8 blocos.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('Erro da API da Anthropic:', anthropicResponse.status, errText);
      return res.status(502).json({ error: 'Falha ao gerar a programação. Tente novamente.' });
    }

    const data = await anthropicResponse.json();
    const rawText = (data.content || []).map(b => b.text || '').join('\n');
    const clean = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('Falha ao interpretar JSON da IA:', clean);
      return res.status(502).json({ error: 'A IA retornou um formato inesperado. Tente novamente.' });
    }

    // Sanitiza os tipos de bloco e garante que os campos novos sempre existam com o tipo certo.
    if (Array.isArray(parsed.blocos)) {
      parsed.blocos = parsed.blocos.map(b => ({
        ...b,
        tipo: TIPOS_VALIDOS.includes(b.tipo) ? b.tipo : 'dinamica',
        checklist: Array.isArray(b.checklist) ? b.checklist.slice(0, 3) : [],
        sugestao_musical: typeof b.sugestao_musical === 'string' ? b.sugestao_musical : ''
      }));
    }
    if (!parsed.kit_divulgacao || typeof parsed.kit_divulgacao !== 'object') {
      parsed.kit_divulgacao = { post_instagram: '', convite_whatsapp: '' };
    }
    parsed.calendario_editorial = Array.isArray(parsed.calendario_editorial)
      ? parsed.calendario_editorial.slice(0, 8).map(item => ({
          quando: item.quando || '',
          plataforma: item.plataforma || '',
          formato: item.formato || '',
          ideia: item.ideia || ''
        }))
      : [];
    parsed.calendario_editorial = Array.isArray(parsed.calendario_editorial)
      ? parsed.calendario_editorial.slice(0, 8)
      : [];

    res.json(parsed);
  } catch (err) {
    console.error('Erro interno em /api/gerar-programacao:', err);
    res.status(500).json({ error: 'Erro interno ao gerar programação.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gerador de Programação de Evento rodando em http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('AVISO: ANTHROPIC_API_KEY não definida. Copie .env.example para .env e preencha sua chave para a geração de IA funcionar.');
  }
});
