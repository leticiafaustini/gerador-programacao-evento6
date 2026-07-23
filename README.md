# Gerador de Programação de Evento — e-inscrição

Lead magnet interativo para organizadores de eventos cristãos: o organizador informa tema, público, duração e formato do evento, e a IA gera uma programação completa e personalizada em segundos. Antes de ver o resultado, ele preenche um formulário de contato que é enviado para o HubSpot.

## O que tem aqui

```
gerador-app/
├── server.js          → backend (Express) que chama a IA com a chave protegida
├── package.json
├── .env.example        → modelo do arquivo de variáveis de ambiente
├── public/
│   └── index.html       → frontend completo (formulários + geração + resultado)
└── README.md
```

## Novidades desta versão

Cada programação gerada agora inclui:
- **Checklist de materiais/responsáveis** em cada bloco
- **Sugestão de estilo musical** nos blocos de louvor (apenas direção estilística, nunca letras ou músicas específicas)
- **Kit de divulgação** com legenda de Instagram e convite de WhatsApp prontos para copiar
- **Calendário editorial** com sugestões de conteúdo para redes sociais, do início da divulgação até um recap pós-evento
- **Capa personalizada** com o nome da igreja/ministério informado no formulário de lead
- **CTA final** convidando a criar as inscrições do evento na e-inscrição

**Importante:** dentro de `public/index.html`, procure pelo comentário `<!-- Substitua o href abaixo -->` e troque a URL `https://e-inscricao.com/cadastro` pelo link real de cadastro/criação de evento de vocês.

## Atualizando uma versão já publicada no Render

Se você já tem esse projeto rodando no GitHub/Render e só quer atualizar os arquivos (sem refazer o processo do zero):

1. No GitHub, abra o repositório e entre no arquivo que mudou (ex: `public/index.html` ou `server.js`)
2. Clique no ícone de lápis (editar) no canto superior direito do arquivo
3. Apague todo o conteúdo antigo e cole o conteúdo novo
4. Role até o fim, clique em **"Commit changes"**
5. O Render detecta a mudança automaticamente e republica sozinho em 1-2 minutos (acompanhe em **Logs**)



1. Instale as dependências:
   ```
   npm install
   ```
2. Copie o arquivo de exemplo e preencha sua chave da Anthropic:
   ```
   cp .env.example .env
   ```
   Abra `.env` e cole sua chave em `ANTHROPIC_API_KEY=` (pegue em console.anthropic.com → API Keys).
3. Suba o servidor:
   ```
   npm start
   ```
4. Acesse `http://localhost:3000` no navegador. O fluxo completo funciona, incluindo a geração real com IA.

## Configurando o HubSpot (captura de lead)

O arquivo `public/index.html` já está preparado para enviar os dados do formulário (nome, e-mail, igreja/ministério, cargo) direto para um formulário do HubSpot, sem precisar de backend adicional para isso.

1. No HubSpot, crie um formulário com os campos: **Nome** (firstname), **E-mail** (email), **Empresa/Ministério** (company) e **Cargo** (jobtitle) — ou ajuste os nomes dos campos no código se usar propriedades customizadas.
2. Pegue o **Portal ID** da conta (Configurações → Conta → ID da conta) e o **Form GUID** (abra o formulário no editor, o GUID aparece na URL).
3. Abra `public/index.html`, encontre estas duas linhas perto do início do `<script>`:
   ```js
   const HUBSPOT_PORTAL_ID = 'SEU_PORTAL_ID';
   const HUBSPOT_FORM_GUID = 'SEU_FORM_GUID';
   ```
4. Substitua pelos valores reais. Pronto — a partir daí, todo lead que preencher o formulário é enviado automaticamente ao HubSpot antes de ver a programação gerada.

Enquanto esses valores não forem preenchidos, a ferramenta continua funcionando normalmente (só não envia o lead para lugar nenhum — fica registrado apenas no console do navegador como aviso).

## Colocando no ar (deploy)

Qualquer serviço que rode Node.js funciona. Sugestões simples:

- **Render / Railway**: conecte o repositório, defina a variável de ambiente `ANTHROPIC_API_KEY` no painel do serviço, comando de start `npm start`.
- **VPS próprio**: `npm install --production`, configure `.env` no servidor, rode com um gerenciador de processos como PM2 (`pm2 start server.js`).

Importante: a chave da API **nunca** deve ir para o frontend nem para o repositório público — ela fica só na variável de ambiente do servidor.

Para embedar no site (ex: dentro de uma página do site institucional), use um `<iframe>` apontando para a URL onde a ferramenta estiver hospedada:
```html
<iframe src="https://sua-url-aqui.com" width="100%" height="900" style="border:none;"></iframe>
```

## Personalização rápida

- **Cores e tipografia**: variáveis CSS no topo de `public/index.html` (`:root`), já configuradas em roxo + verde-água com a fonte Rethink Sans.
- **Prompt da IA**: dentro de `server.js`, na função da rota `/api/gerar-programacao` — ajuste o texto do prompt se quiser mudar o tom, o número máximo de blocos ou o formato de saída.
- **Campos do formulário de evento**: em `public/index.html`, dentro de `<section id="step-event">`.

## Suporte

Qualquer erro na geração aparece tanto na tela (mensagem amigável) quanto no console do servidor (log técnico completo), o que ajuda a diagnosticar rápido se for problema de chave de API, de formato de resposta da IA, ou de conexão.
