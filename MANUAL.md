# Manual de instalação e uso — Briefing Reader

## 1. Objetivo da ferramenta

O Briefing Reader transforma materiais enviados pelo cliente em um briefing de trabalho padronizado.

Ele foi pensado para receber documentos que normalmente chegam com informações espalhadas — apresentações, PDFs, Word, textos de e-mail, mensagens e anotações — e reorganizá-los para uso de atendimento, planejamento, redação e direção de arte.

A ferramenta não deve inventar informações ausentes. Quando não encontra um dado, a orientação dada à IA é registrar **Não informado** e criar uma pendência quando essa ausência pode comprometer a execução do job.

---

## 2. Arquivos do projeto

### `index.html`
Tela principal da aplicação. Carrega interface, bibliotecas de leitura e scripts.

### `identity.css`
Identidade visual base fornecida para o projeto. Contém cores, tokens, temas, campos, botões, tabelas, drawers e padrões de interface.

### `app.css`
Complementos de layout exclusivos do Briefing Reader.

### `app.js`
Toda a lógica da aplicação:

- leitura dos arquivos;
- montagem do conteúdo;
- chamada da IA;
- prompt central;
- interpretação do JSON;
- renderização do briefing;
- edição;
- exportações.

### `config.js`
Arquivo que você normalmente precisará editar primeiro. Define provedor, chave, modelo, nome do produto e limite de tamanho dos arquivos.

### `.nojekyll`
Impede processamento desnecessário do Jekyll no GitHub Pages.

### `404.html`
Fallback simples para retornar o usuário à aplicação.

---

# PARTE A — Configurar a IA

## 3. Usando OpenAI

Abra `config.js` e deixe:

```js
provider: 'openai'
```

Depois configure:

```js
openai: {
  apiKey: 'SUA_CHAVE_AQUI',
  model: 'gpt-4.1-mini'
}
```

O nome do modelo é configurável. Caso sua conta utilize outro modelo, basta trocar o valor de `model`.

## 4. Usando Gemini

No mesmo arquivo:

```js
provider: 'gemini'
```

E:

```js
gemini: {
  apiKey: 'SUA_CHAVE_AQUI',
  model: 'gemini-2.5-flash'
}
```

Também é possível mudar a IA pela própria tela usando o botão **CONFIG**.

---

## 5. Importante sobre a chave

O GitHub Pages é uma hospedagem estática. A página roda no computador do usuário e chama diretamente a API escolhida.

Portanto, mesmo que a chave esteja escrita em um arquivo chamado `config.js`, ela **não está protegida**.

Um usuário que tenha acesso à ferramenta pode localizar a chave por meio do navegador.

Como esta implantação foi definida para poucas pessoas, a recomendação operacional é:

1. criar uma chave separada apenas para este projeto;
2. estabelecer limite de gastos/uso;
3. não usar a chave principal de nenhuma conta;
4. trocar a chave periodicamente;
5. não divulgar a URL fora do grupo autorizado.

Nenhuma técnica em HTML/JavaScript puro consegue esconder de verdade essa chave no GitHub Pages.

---

# PARTE B — Subir no GitHub

## 6. Criar o repositório

No GitHub:

1. crie um novo repositório;
2. dê um nome, por exemplo `briefing-reader`;
3. faça upload de **todos os arquivos desta pasta** para a raiz do repositório;
4. confirme o commit.

A raiz precisa ficar parecida com:

```text
/briefing-reader
  index.html
  app.js
  app.css
  identity.css
  config.js
  404.html
  .nojekyll
  README.md
  MANUAL.md
```

Não coloque tudo dentro de uma segunda pasta `briefing-reader/briefing-reader/`.

---

## 7. Ativar GitHub Pages

Dentro do repositório:

1. abra **Settings**;
2. entre em **Pages**;
3. localize **Build and deployment**;
4. em **Source**, escolha **Deploy from a branch**;
5. em **Branch**, escolha `main`;
6. escolha `/ (root)`;
7. clique em **Save**.

A URL normalmente seguirá este padrão:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

---

## 8. Atualizar a plataforma depois

Sempre que você alterar um arquivo no repositório e fizer commit na branch publicada, o GitHub Pages republicará o site.

Para trocar somente a chave ou o modelo:

1. edite `config.js`;
2. salve/commit;
3. aguarde a publicação do GitHub Pages ser atualizada.

---

# PARTE C — Como usar

## 9. Criar um briefing

Na tela inicial você pode:

### Opção 1 — enviar arquivo

Arraste ou selecione:

- PDF
- PPTX
- DOCX
- TXT
- MD

### Opção 2 — colar texto

Cole diretamente:

- e-mail;
- WhatsApp;
- pedido do cliente;
- ata;
- anotação;
- briefing textual.

### Opção 3 — combinar os dois

Você pode enviar um documento e também colar informações complementares. Os dois conteúdos serão considerados na mesma análise.

Clique em **GERAR BRIEFING**.

---

## 10. O que é analisado

A ferramenta solicita à IA:

- cliente;
- projeto/campanha;
- demanda;
- objetivo;
- público-alvo;
- contexto;
- mensagem principal;
- mensagens secundárias;
- canal;
- CTA;
- tom de voz;
- entregáveis;
- formatos;
- dimensões;
- direção visual;
- cores;
- obrigatoriedades;
- restrições;
- regras e mecânicas;
- datas e prazos;
- referências;
- contradições;
- pendências;
- resumo para criação.

---

## 11. Abas do resultado

### VISÃO GERAL
Informações centrais do job. Os principais campos são editáveis diretamente na tela.

### ENTREGÁVEIS
Lista as peças identificadas, com formato, dimensão e canal quando encontrados.

### CONTEÚDO
Mensagens secundárias, mecânica, regras, datas, materiais e contradições.

### VISUAL
Direção visual, cores, obrigatoriedades e restrições.

### PENDÊNCIAS
Pontos ausentes ou que precisam de confirmação. Quando possível, a IA também cria a pergunta que atendimento pode enviar ao cliente.

### PARA CRIAÇÃO
Versão compacta e operacional do briefing para DA, designer ou redação.

---

## 12. Referências de fonte

PDFs são transformados em blocos como:

```text
[PDF · PÁGINA 3]
...
```

PowerPoints:

```text
[PPTX · SLIDE 7]
...
```

Isso permite que a IA associe informações à origem.

Quando essa associação é devolvida, a interface exibe **VER FONTE**.

---

## 13. Exportações

### COPIAR
Copia o briefing completo em Markdown para a área de transferência.

### EXPORTAR MD
Baixa `briefing.md`.

### EXPORTAR JSON
Baixa a estrutura completa em `briefing.json`.

### IMPRIMIR / PDF
Abre a impressão do navegador. Escolha **Salvar como PDF** para gerar uma versão compartilhável.

---

# PARTE D — Personalização

## 14. Alterar nome da ferramenta

Em `config.js`:

```js
app: {
  name: 'Briefing Reader',
  brand: 'PAUTA'
}
```

Exemplo:

```js
app: {
  name: 'Digi Brief',
  brand: 'DIGI'
}
```

---

## 15. Alterar o padrão do briefing

Abra `app.js` e procure:

```js
const SYSTEM_PROMPT = `...
```

Esse é o cérebro editorial da ferramenta.

No mesmo bloco existe o formato JSON exigido da IA.

Ao criar novos campos, você precisará também atualizar a renderização correspondente no JavaScript.

---

## 16. Alterar as cores

O ideal é modificar apenas os tokens de `identity.css`, não sair substituindo cores em `app.css`.

Exemplo:

```css
--accent:#EA0356;
```

A interface usa `var(--accent)`, `var(--surface)`, `var(--line)` e os demais tokens da identidade.

---

# PARTE E — Limitações desta V1

## 17. PowerPoint

A versão atual lê o **texto existente no PPTX** e preserva a separação por slide.

Ela não interpreta visualmente fotos, layouts, gráficos ou imagens embutidas no PowerPoint.

Isso pode ser evoluído posteriormente para uma leitura multimodal.

## 18. PDF

A V1 lê a camada de texto do PDF.

PDFs escaneados, compostos somente por imagens, podem retornar pouco ou nenhum texto porque não existe OCR local nesta versão.

## 19. Arquivos grandes

O limite padrão configurado é 35 MB. Ele pode ser alterado em `config.js`.

Além do peso do arquivo, documentos com centenas de páginas podem ultrapassar o limite de entrada do modelo de IA selecionado.

## 20. Dependências externas

PDF.js, JSZip e Mammoth são carregados via CDN. Portanto a página precisa de acesso à internet para abrir essas bibliotecas e para chamar OpenAI/Gemini.

---

# PARTE F — Checklist antes de publicar

- [ ] Escolhi OpenAI ou Gemini.
- [ ] Criei uma chave exclusiva para o projeto.
- [ ] Defini limite de uso no provedor.
- [ ] Colei a chave em `config.js`.
- [ ] Conferi o modelo configurado.
- [ ] Ajustei nome e marca da plataforma.
- [ ] Subi todos os arquivos para a raiz do repositório.
- [ ] Ativei GitHub Pages em `main / root`.
- [ ] Testei um TXT simples.
- [ ] Testei um PDF.
- [ ] Testei um PPTX.
- [ ] Testei o botão de exportar.
- [ ] Confirmei que a URL será compartilhada somente com o grupo previsto.

---

## Próximas evoluções sugeridas

A arquitetura desta V1 permite evoluir depois para:

- múltiplos arquivos no mesmo job;
- leitura multimodal de layouts e imagens;
- OCR para PDFs escaneados;
- histórico de briefings no navegador;
- modelos diferentes de briefing;
- botão “gerar perguntas para o cliente” separado;
- exportação em DOCX;
- comparação entre briefing original e briefing atualizado;
- leitura de regulamentos e mecânicas complexas;
- biblioteca de padrões por cliente.
