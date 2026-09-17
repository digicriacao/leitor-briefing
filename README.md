# Briefing Reader

Leitor inteligente de briefings para GitHub Pages.

A ferramenta recebe PDF, PPTX, DOCX, TXT, Markdown ou texto colado e transforma o material em um briefing padronizado para atendimento e criação.

## O que a versão atual faz

- Upload por clique ou arrastar e soltar.
- Leitura de PDF por página.
- Leitura de PPTX por slide.
- Leitura de DOCX.
- Leitura de TXT/MD.
- Campo para texto colado.
- OpenAI ou Google Gemini.
- Identificação de objetivo, público, contexto, mensagem, CTA, tom de voz e canal.
- Identificação de todos os entregáveis encontrados.
- Identificação de dimensões, prazos, obrigatoriedades, restrições, regras e direção visual.
- Lista automática de pendências e perguntas para o cliente.
- Referências de origem quando a IA consegue relacionar a informação ao material.
- Briefing resumido para criação.
- Edição de campos na interface.
- Copiar briefing.
- Exportar Markdown.
- Exportar JSON.
- Imprimir / salvar como PDF pelo navegador.
- Tema claro, escuro e automático.

## Estrutura

```text
briefing-reader/
├── .nojekyll
├── 404.html
├── index.html
├── identity.css
├── app.css
├── app.js
├── config.js
├── README.md
└── MANUAL.md
```

## Início rápido

1. Abra `config.js`.
2. Escolha `openai` ou `gemini` em `provider`.
3. Cole a chave da API no campo correspondente.
4. Confira o nome do modelo.
5. Envie todos os arquivos desta pasta para a raiz de um repositório no GitHub.
6. No GitHub, abra **Settings > Pages**.
7. Em **Build and deployment**, escolha **Deploy from a branch**.
8. Selecione a branch `main` e a pasta `/ (root)`.
9. Salve.

Não há `npm install`, compilação ou servidor próprio.

## Segurança da chave

Esta aplicação foi solicitada para funcionar somente no GitHub Pages, portanto ela roda inteiramente no navegador. Não existe backend para ocultar a chave.

Isso significa que qualquer chave gravada em `config.js` pode ser visualizada por um usuário que tenha acesso à página e abra as ferramentas de desenvolvedor.

Para reduzir risco:

- crie uma chave exclusiva para esta ferramenta;
- não reutilize uma chave de produção;
- configure limites de orçamento/uso no provedor;
- restrinja quem recebe o endereço da ferramenta;
- rotacione a chave periodicamente;
- remova a chave imediatamente caso o endereço seja compartilhado fora do grupo.

## Identidade visual

`identity.css` é a base visual fornecida para o projeto. As telas complementares estão em `app.css`. A interface continua usando os tokens do sistema (`--surface`, `--line`, `--accent`, etc.) para manter consistência entre os temas.

## Customização principal

- Nome da plataforma: `config.js` > `app.name`
- Marca no cabeçalho: `config.js` > `app.brand`
- Provedor padrão: `config.js` > `provider`
- Modelo: `config.js` > `openai.model` ou `gemini.model`
- Prompt/estrutura do briefing: procure por `SYSTEM_PROMPT` em `app.js`
- Aparência específica desta ferramenta: `app.css`
- Tokens/identidade geral: `identity.css`
