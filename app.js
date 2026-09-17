(() => {
  const cfgFile = window.BRIEFING_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const state = {
    file: null,
    sourceText: '',
    sourceName: '',
    sourceType: '',
    briefing: null,
    currentTab: 'overview',
    runtimeConfig: loadRuntimeConfig()
  };

  const essentialFields = ['cliente','projeto','demanda','objetivo','publico_alvo','mensagem_principal','canal','cta'];

  const els = {
    brandName: $('#brandName'), productName: $('#productName'), themeBtn: $('#themeBtn'), settingsBtn: $('#settingsBtn'),
    fileInput: $('#fileInput'), dropzone: $('#dropzone'), fileInfo: $('#fileInfo'), fileName: $('#fileName'), fileMeta: $('#fileMeta'), removeFileBtn: $('#removeFileBtn'),
    rawText: $('#rawText'), charCount: $('#charCount'), clearTextBtn: $('#clearTextBtn'), generateBtn: $('#generateBtn'), providerStatus: $('#providerStatus'),
    inputView: $('#inputView'), processingView: $('#processingView'), resultView: $('#resultView'), progressBar: $('#progressBar'), steps: $('#steps'), processingChip: $('#processingChip'),
    resultTitle: $('#resultTitle'), tabContent: $('#tabContent'), tabs: $('#tabs'),
    kpiCompleteness: $('#kpiCompleteness'), kpiDeliverables: $('#kpiDeliverables'), kpiPending: $('#kpiPending'), kpiDates: $('#kpiDates'), kpiSources: $('#kpiSources'), kpiConfidence: $('#kpiConfidence'),
    newBriefingBtn: $('#newBriefingBtn'), copyBtn: $('#copyBtn'), exportMdBtn: $('#exportMdBtn'), exportJsonBtn: $('#exportJsonBtn'), printBtn: $('#printBtn'),
    settingsDrawer: $('#settingsDrawer'), settingsScrim: $('#settingsScrim'), closeSettingsBtn: $('#closeSettingsBtn'), providerSelect: $('#providerSelect'), apiKeyInput: $('#apiKeyInput'), modelInput: $('#modelInput'), rememberConfig: $('#rememberConfig'), resetConfigBtn: $('#resetConfigBtn'), saveConfigBtn: $('#saveConfigBtn'),
    sourceDrawer: $('#sourceDrawer'), sourceScrim: $('#sourceScrim'), sourceTitle: $('#sourceTitle'), sourceBody: $('#sourceBody'), closeSourceBtn: $('#closeSourceBtn'), toast: $('#toast')
  };

  init();

  function init() {
    els.brandName.textContent = cfgFile.app?.brand || 'PAUTA';
    els.productName.textContent = cfgFile.app?.name || 'Briefing Reader';
    document.title = cfgFile.app?.name || 'Briefing Reader';
    updateProviderStatus();
    bindEvents();
  }

  function bindEvents() {
    els.fileInput.addEventListener('change', e => selectFile(e.target.files[0]));
    ['dragenter','dragover'].forEach(evt => els.dropzone.addEventListener(evt, e => { e.preventDefault(); els.dropzone.classList.add('drag'); }));
    ['dragleave','drop'].forEach(evt => els.dropzone.addEventListener(evt, e => { e.preventDefault(); els.dropzone.classList.remove('drag'); }));
    els.dropzone.addEventListener('drop', e => selectFile(e.dataTransfer.files[0]));
    els.removeFileBtn.addEventListener('click', clearFile);
    els.rawText.addEventListener('input', () => els.charCount.textContent = `${els.rawText.value.length.toLocaleString('pt-BR')} caracteres`);
    els.clearTextBtn.addEventListener('click', () => { els.rawText.value=''; els.rawText.dispatchEvent(new Event('input')); });
    els.generateBtn.addEventListener('click', generateBriefing);
    els.themeBtn.addEventListener('click', toggleTheme);
    els.settingsBtn.addEventListener('click', openSettings);
    els.closeSettingsBtn.addEventListener('click', closeSettings);
    els.settingsScrim.addEventListener('click', closeSettings);
    els.saveConfigBtn.addEventListener('click', saveSettings);
    els.resetConfigBtn.addEventListener('click', resetSettings);
    els.providerSelect.addEventListener('change', hydrateSettingsFields);
    els.tabs.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]'); if (!btn) return;
      state.currentTab = btn.dataset.tab;
      $$('.tab').forEach(x => x.classList.toggle('on', x === btn));
      renderCurrentTab();
    });
    els.newBriefingBtn.addEventListener('click', resetToInput);
    els.copyBtn.addEventListener('click', () => copyText(toMarkdown(state.briefing)));
    els.exportMdBtn.addEventListener('click', () => downloadText('briefing.md', toMarkdown(state.briefing), 'text/markdown'));
    els.exportJsonBtn.addEventListener('click', () => downloadText('briefing.json', JSON.stringify(state.briefing, null, 2), 'application/json'));
    els.printBtn.addEventListener('click', () => window.print());
    els.closeSourceBtn.addEventListener('click', closeSource);
    els.sourceScrim.addEventListener('click', closeSource);
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-source-index]');
      if (btn) openSource(Number(btn.dataset.sourceIndex), btn.dataset.sourceTitle || 'Referência');
    });
  }

  function selectFile(file) {
    if (!file) return;
    const max = (cfgFile.app?.maxFileSizeMB || 35) * 1024 * 1024;
    if (file.size > max) return toast(`Arquivo acima de ${cfgFile.app?.maxFileSizeMB || 35} MB.`);
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf','pptx','docx','txt','md'].includes(ext)) return toast('Formato não suportado nesta versão.');
    state.file = file;
    els.fileName.textContent = file.name;
    els.fileMeta.textContent = `${ext.toUpperCase()} · ${formatBytes(file.size)}`;
    els.fileInfo.hidden = false;
  }

  function clearFile() {
    state.file = null; els.fileInput.value=''; els.fileInfo.hidden = true;
  }

  async function generateBriefing() {
    const pasted = els.rawText.value.trim();
    if (!state.file && !pasted) return toast('Envie um arquivo ou cole um texto.');
    const conf = activeAIConfig();
    if (!isKeyReady(conf.apiKey)) { openSettings(); return toast('Configure a chave da API antes de gerar.'); }

    showProcessing();
    try {
      updateStep(0, 'active'); setProgress(8);
      let extracted = '';
      if (state.file) {
        extracted = await extractFile(state.file);
        state.sourceName = state.file.name;
        state.sourceType = state.file.name.split('.').pop().toUpperCase();
      }
      updateStep(0, 'done'); updateStep(1, 'active'); setProgress(28);

      const combined = [extracted, pasted ? `\n\n[TEXTO COLADO PELO USUÁRIO]\n${pasted}` : ''].filter(Boolean).join('\n');
      state.sourceText = combined;
      if (!combined.trim()) throw new Error('Não foi possível extrair texto do material.');
      updateStep(1, 'done'); updateStep(2, 'active'); setProgress(44);

      const prompt = buildPrompt(combined);
      updateStep(2, 'done'); updateStep(3, 'active'); setProgress(58);
      const raw = await callAI(prompt, conf);
      updateStep(3, 'done'); updateStep(4, 'active'); setProgress(78);

      const briefing = normalizeBriefing(parseAIJson(raw));
      state.briefing = briefing;
      updateStep(4, 'done'); updateStep(5, 'active'); setProgress(92);
      await sleep(180);
      updateStep(5, 'done'); setProgress(100);
      await sleep(220);
      showResult();
    } catch (err) {
      console.error(err);
      els.processingChip.textContent = 'ERRO';
      els.processingChip.style.setProperty('--cor','var(--alerta)');
      toast(err.message || 'Erro ao gerar briefing.');
      setTimeout(() => { els.processingView.hidden = true; els.inputView.hidden = false; }, 800);
    }
  }

  async function extractFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return extractPdf(file);
    if (ext === 'pptx') return extractPptx(file);
    if (ext === 'docx') return extractDocx(file);
    return file.text();
  }

  async function extractPdf(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: buf}).promise;
    const pages = [];
    for (let i=1; i<=pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(x => x.str).join(' ').replace(/\s+/g,' ').trim();
      pages.push(`[PDF · PÁGINA ${i}]\n${text}`);
    }
    return pages.join('\n\n');
  }

  async function extractPptx(file) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slideNames = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a,b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
    const slides = [];
    for (const name of slideNames) {
      const xml = await zip.file(name).async('text');
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const texts = [...doc.getElementsByTagNameNS('*','t')].map(n => n.textContent).filter(Boolean);
      const n = name.match(/slide(\d+)/)[1];
      slides.push(`[PPTX · SLIDE ${n}]\n${texts.join(' ').replace(/\s+/g,' ').trim()}`);
    }
    return slides.join('\n\n');
  }

  async function extractDocx(file) {
    const result = await mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()});
    return `[DOCX]\n${result.value}`;
  }

  function buildPrompt(source) {
    return `${SYSTEM_PROMPT}\n\nMATERIAL PARA ANÁLISE:\n${source}`;
  }

  const SYSTEM_PROMPT = `Você é um especialista sênior em atendimento, planejamento e criação publicitária. Sua tarefa é transformar materiais brutos em um briefing operacional e confiável para equipes de marketing, comunicação, design, redação, eventos, promoções e campanhas de incentivo.

REGRAS OBRIGATÓRIAS:
1. Não faça apenas um resumo. Estruture o job para execução.
2. Nunca invente informação. Quando não houver dado suficiente, use "Não informado".
3. Diferencie informação explícita de inferência.
4. Identifique TODOS os entregáveis, formatos, dimensões, canais, CTAs, datas, prazos, públicos, mensagens, regras, mecânicas, identidade visual, obrigatoriedades e restrições.
5. Preserve nomes próprios, marcas, programas, valores, datas, percentuais e termos do material.
6. Se houver contradições, registre em "contradicoes" sem escolher uma versão como verdadeira.
7. Gere pendências úteis para o atendimento confirmar com o cliente.
8. Sempre que possível, associe cada informação relevante à origem usando referências como "PDF · PÁGINA 7", "PPTX · SLIDE 4", "DOCX" ou "TEXTO COLADO PELO USUÁRIO".
9. O campo resumo_para_criacao deve ser curto, direto e suficiente para um diretor de arte ou redator entender o job.
10. Responda SOMENTE com JSON válido, sem markdown e sem comentários.

FORMATO EXATO DO JSON:
{
  "cliente": "",
  "projeto": "",
  "demanda": "",
  "objetivo": "",
  "publico_alvo": "",
  "contexto": "",
  "mensagem_principal": "",
  "mensagens_secundarias": [],
  "canal": "",
  "cta": "",
  "tom_de_voz": "",
  "entregaveis": [
    {"nome":"","tipo":"","formato":"","dimensoes":"","canal":"","observacoes":"","fonte":""}
  ],
  "direcao_visual": [],
  "cores": [],
  "obrigatoriedades": [],
  "restricoes": [],
  "mecanica_regras": [],
  "datas_prazos": [{"descricao":"","data":"","fonte":""}],
  "materiais_referencia": [],
  "contradicoes": [],
  "pendencias": [{"titulo":"","descricao":"","pergunta_cliente":""}],
  "fontes": [{"campo":"","origem":"","trecho":""}],
  "resumo_para_criacao": "",
  "confianca": {"explicitas":0,"inferidas":0,"nao_informadas":0}
}`;

  async function callAI(prompt, conf) {
    if (conf.provider === 'gemini') return callGemini(prompt, conf);
    return callOpenAI(prompt, conf);
  }

  async function callOpenAI(prompt, conf) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${conf.apiKey}`},
      body:JSON.stringify({
        model: conf.model,
        temperature: 0.15,
        response_format: {type:'json_object'},
        messages:[
          {role:'system',content:'Você responde apenas JSON válido.'},
          {role:'user',content:prompt}
        ]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Erro OpenAI ${res.status}`);
    return data.choices?.[0]?.message?.content || '';
  }

  async function callGemini(prompt, conf) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(conf.model)}:generateContent?key=${encodeURIComponent(conf.apiKey)}`;
    const res = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.15,responseMimeType:'application/json'}
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Erro Gemini ${res.status}`);
    return data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
  }

  function parseAIJson(raw) {
    if (!raw) throw new Error('A IA retornou uma resposta vazia.');
    const cleaned = raw.replace(/^```json\s*/i,'').replace(/```$/,'').trim();
    try { return JSON.parse(cleaned); }
    catch {
      const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start,end+1));
      throw new Error('A IA não retornou JSON válido.');
    }
  }

  function normalizeBriefing(b) {
    const arr = k => Array.isArray(b[k]) ? b[k] : (b[k] ? [b[k]] : []);
    const text = k => (typeof b[k] === 'string' && b[k].trim()) ? b[k].trim() : 'Não informado';
    return {
      cliente:text('cliente'), projeto:text('projeto'), demanda:text('demanda'), objetivo:text('objetivo'), publico_alvo:text('publico_alvo'), contexto:text('contexto'), mensagem_principal:text('mensagem_principal'),
      mensagens_secundarias:arr('mensagens_secundarias'), canal:text('canal'), cta:text('cta'), tom_de_voz:text('tom_de_voz'), entregaveis:arr('entregaveis'), direcao_visual:arr('direcao_visual'), cores:arr('cores'), obrigatoriedades:arr('obrigatoriedades'), restricoes:arr('restricoes'), mecanica_regras:arr('mecanica_regras'), datas_prazos:arr('datas_prazos'), materiais_referencia:arr('materiais_referencia'), contradicoes:arr('contradicoes'), pendencias:arr('pendencias'), fontes:arr('fontes'), resumo_para_criacao:text('resumo_para_criacao'),
      confianca: typeof b.confianca === 'object' && b.confianca ? b.confianca : {explicitas:0,inferidas:0,nao_informadas:0}
    };
  }

  function showProcessing() {
    els.inputView.hidden = true; els.resultView.hidden = true; els.processingView.hidden = false;
    els.processingChip.textContent = 'PROCESSANDO';
    setProgress(0);
    const labels = ['Extraindo conteúdo','Organizando a fonte','Identificando contexto e demanda','Mapeando entregáveis e regras','Verificando lacunas e pendências','Construindo briefing final'];
    els.steps.innerHTML = labels.map((x,i)=>`<div class="step" data-step="${i}"><b>${x}</b><span class="step-state">AGUARDANDO</span></div>`).join('');
  }
  function updateStep(i,status){const el=$(`[data-step="${i}"]`);if(!el)return;el.classList.remove('done','active');el.classList.add(status);el.querySelector('.step-state').textContent=status==='done'?'CONCLUÍDO':'ANALISANDO';}
  function setProgress(n){els.progressBar.style.width=`${n}%`;}

  function showResult() {
    els.processingView.hidden = true; els.resultView.hidden = false;
    els.resultTitle.textContent = state.briefing.projeto !== 'Não informado' ? state.briefing.projeto : (state.briefing.cliente !== 'Não informado' ? state.briefing.cliente : 'Briefing');
    updateKPIs();
    state.currentTab='overview'; $$('.tab').forEach(x=>x.classList.toggle('on',x.dataset.tab==='overview')); renderCurrentTab();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function updateKPIs() {
    const b=state.briefing;
    const complete = essentialFields.filter(k => b[k] && b[k] !== 'Não informado').length;
    els.kpiCompleteness.textContent = `${Math.round((complete/essentialFields.length)*100)}%`;
    els.kpiDeliverables.textContent = b.entregaveis.length;
    els.kpiPending.textContent = b.pendencias.length;
    els.kpiDates.textContent = b.datas_prazos.length;
    els.kpiSources.textContent = b.fontes.length;
    const c=b.confianca||{}; const total=(+c.explicitas||0)+(+c.inferidas||0)+(+c.nao_informadas||0);
    els.kpiConfidence.textContent = total ? `${Math.round(((+c.explicitas||0)/total)*100)}%` : '—';
  }

  function renderCurrentTab() {
    const b=state.briefing; if(!b)return;
    const map={overview:renderOverview,deliverables:renderDeliverables,content:renderContent,visual:renderVisual,pending:renderPending,creation:renderCreation};
    els.tabContent.innerHTML = map[state.currentTab]();
    bindEditableFields();
  }

  function renderOverview(){const b=state.briefing;return `<div class="section-grid">${fieldCard('Cliente','cliente',b.cliente)}${fieldCard('Projeto / campanha','projeto',b.projeto)}${fieldCard('Demanda','demanda',b.demanda,true)}${fieldCard('Objetivo','objetivo',b.objetivo,true)}${fieldCard('Público-alvo','publico_alvo',b.publico_alvo)}${fieldCard('Canal','canal',b.canal)}${fieldCard('Contexto','contexto',b.contexto,true)}${fieldCard('Mensagem principal','mensagem_principal',b.mensagem_principal,true)}${fieldCard('CTA','cta',b.cta)}${fieldCard('Tom de voz','tom_de_voz',b.tom_de_voz)}</div>`;}
  function renderDeliverables(){const a=state.briefing.entregaveis;if(!a.length)return empty('Nenhum entregável identificado.');return a.map((d,i)=>`<article class="deliverable"><div class="deliverable-index">${String(i+1).padStart(2,'0')}</div><div><h3>${esc(d.nome||d.tipo||'Entregável')}</h3><p><b>Tipo:</b> ${esc(d.tipo||'Não informado')}</p><p><b>Formato:</b> ${esc(d.formato||'Não informado')} · <b>Dimensões:</b> ${esc(d.dimensoes||'Não informado')}</p><p><b>Canal:</b> ${esc(d.canal||'Não informado')}</p>${d.observacoes?`<p>${esc(d.observacoes)}</p>`:''}</div>${d.fonte?`<button class="source-btn" data-source-title="${escAttr(d.nome||'Entregável')}" data-source-index="${sourceIndexByText(d.fonte)}">VER FONTE</button>`:''}</article>`).join('');}
  function renderContent(){const b=state.briefing;return `<div class="section-grid">${listCard('Mensagens secundárias',b.mensagens_secundarias)}${listCard('Mecânica / regras',b.mecanica_regras)}${listCard('Datas e prazos',b.datas_prazos.map(x=>typeof x==='string'?x:`${x.descricao||''}${x.data?` — ${x.data}`:''}`))}${listCard('Materiais de referência',b.materiais_referencia)}${listCard('Contradições',b.contradicoes,true)}</div>`;}
  function renderVisual(){const b=state.briefing;return `<div class="section-grid">${listCard('Direção visual',b.direcao_visual)}${listCard('Cores',b.cores)}${listCard('Obrigatoriedades',b.obrigatoriedades)}${listCard('Restrições',b.restricoes,true)}</div>`;}
  function renderPending(){const p=state.briefing.pendencias;if(!p.length)return empty('Nenhuma pendência relevante foi identificada.');return p.map(x=>`<article class="pending-item"><h3>${esc(x.titulo||'Ponto para confirmar')}</h3><p>${esc(x.descricao||'')}</p>${x.pergunta_cliente?`<p style="margin-top:7px"><b>Pergunta sugerida:</b> ${esc(x.pergunta_cliente)}</p>`:''}</article>`).join('');}
  function renderCreation(){return `<div class="creation-box"><div class="rotulo" style="margin-bottom:12px">RESUMO PARA CRIAÇÃO</div><pre>${esc(state.briefing.resumo_para_criacao)}</pre></div>`;}

  function fieldCard(label,key,value,full=false){const src=findSource(key,label);return `<article class="brief-card ${full?'full':''}"><div class="card-head"><h3>${esc(label)}</h3>${src>=0?`<button class="source-btn" data-source-title="${escAttr(label)}" data-source-index="${src}">VER FONTE</button>`:''}</div><textarea class="edit-field" data-key="${key}">${esc(value)}</textarea></article>`;}
  function listCard(label,items,full=false){return `<article class="brief-card ${full?'full':''}"><div class="card-head"><h3>${esc(label)}</h3></div>${items?.length?`<ul class="list-clean">${items.map(x=>`<li>${esc(typeof x==='string'?x:JSON.stringify(x))}</li>`).join('')}</ul>`:'<div class="muted">Não informado</div>'}</article>`;}
  function empty(msg){return `<div class="empty-state">${esc(msg)}</div>`;}
  function bindEditableFields(){ $$('.edit-field').forEach(el=>el.addEventListener('change',()=>{state.briefing[el.dataset.key]=el.value.trim()||'Não informado';updateKPIs();})); }

  function findSource(key,label='') { const f=state.briefing.fontes||[]; return f.findIndex(x => String(x.campo||'').toLowerCase().includes(key.replaceAll('_',' ')) || String(x.campo||'').toLowerCase().includes(label.toLowerCase())); }
  function sourceIndexByText(text){const f=state.briefing.fontes||[];const i=f.findIndex(x=>String(x.origem||'').includes(text)||String(x.trecho||'').includes(text));return i>=0?i:0;}
  function openSource(i,title){const src=(state.briefing.fontes||[])[i];if(!src)return;els.sourceTitle.textContent=title;els.sourceBody.innerHTML=`<div class="source-ref"><div class="where">${esc(src.origem||'ORIGEM NÃO INFORMADA')}</div><strong>${esc(src.campo||'Informação')}</strong><blockquote>${esc(src.trecho||'Trecho não fornecido pela IA.')}</blockquote></div>`;els.sourceScrim.classList.add('on');els.sourceDrawer.classList.add('on');}
  function closeSource(){els.sourceScrim.classList.remove('on');els.sourceDrawer.classList.remove('on');}

  function toMarkdown(b){if(!b)return'';const bullets=a=>(a?.length?a.map(x=>`- ${typeof x==='string'?x:formatObjectLine(x)}`).join('\n'):'- Não informado');return `# ${b.projeto !== 'Não informado' ? b.projeto : 'Briefing'}\n\n## Visão geral\n\n**Cliente:** ${b.cliente}\n\n**Demanda:** ${b.demanda}\n\n**Objetivo:** ${b.objetivo}\n\n**Público-alvo:** ${b.publico_alvo}\n\n**Contexto:** ${b.contexto}\n\n**Mensagem principal:** ${b.mensagem_principal}\n\n**Canal:** ${b.canal}\n\n**CTA:** ${b.cta}\n\n**Tom de voz:** ${b.tom_de_voz}\n\n## Entregáveis\n${bullets(b.entregaveis)}\n\n## Mensagens secundárias\n${bullets(b.mensagens_secundarias)}\n\n## Direção visual\n${bullets(b.direcao_visual)}\n\n## Cores\n${bullets(b.cores)}\n\n## Obrigatoriedades\n${bullets(b.obrigatoriedades)}\n\n## Restrições\n${bullets(b.restricoes)}\n\n## Mecânica e regras\n${bullets(b.mecanica_regras)}\n\n## Datas e prazos\n${bullets(b.datas_prazos)}\n\n## Contradições\n${bullets(b.contradicoes)}\n\n## Pendências\n${bullets(b.pendencias)}\n\n## Resumo para criação\n\n${b.resumo_para_criacao}\n`;}
  function formatObjectLine(o){if(!o||typeof o!=='object')return String(o||'');return Object.entries(o).filter(([,v])=>v).map(([k,v])=>`${k.replaceAll('_',' ')}: ${v}`).join(' | ');}

  function openSettings(){hydrateSettingsFields();els.settingsScrim.classList.add('on');els.settingsDrawer.classList.add('on');}
  function closeSettings(){els.settingsScrim.classList.remove('on');els.settingsDrawer.classList.remove('on');}
  function hydrateSettingsFields(){const p=els.providerSelect.value||state.runtimeConfig.provider||cfgFile.provider||'openai';els.providerSelect.value=p;const source=state.runtimeConfig[p]||cfgFile[p]||{};els.apiKeyInput.value=source.apiKey||'';els.modelInput.value=source.model||'';els.rememberConfig.checked=localStorage.getItem('briefing_runtime_config')!==null;}
  function saveSettings(){const p=els.providerSelect.value;state.runtimeConfig.provider=p;state.runtimeConfig[p]={apiKey:els.apiKeyInput.value.trim(),model:els.modelInput.value.trim()};if(els.rememberConfig.checked)localStorage.setItem('briefing_runtime_config',JSON.stringify(state.runtimeConfig));else{localStorage.removeItem('briefing_runtime_config');sessionStorage.setItem('briefing_runtime_config',JSON.stringify(state.runtimeConfig));}closeSettings();updateProviderStatus();toast('Configuração salva.');}
  function resetSettings(){state.runtimeConfig=JSON.parse(JSON.stringify(cfgFile));localStorage.removeItem('briefing_runtime_config');sessionStorage.removeItem('briefing_runtime_config');hydrateSettingsFields();updateProviderStatus();toast('Configuração restaurada a partir do config.js.');}
  function loadRuntimeConfig(){try{return JSON.parse(localStorage.getItem('briefing_runtime_config')||sessionStorage.getItem('briefing_runtime_config'))||JSON.parse(JSON.stringify(cfgFile));}catch{return JSON.parse(JSON.stringify(cfgFile));}}
  function activeAIConfig(){const p=state.runtimeConfig.provider||cfgFile.provider||'openai';const c=state.runtimeConfig[p]||cfgFile[p]||{};return{provider:p,apiKey:c.apiKey||'',model:c.model||''};}
  function updateProviderStatus(){const c=activeAIConfig();els.providerStatus.textContent=`IA: ${c.provider.toUpperCase()} · ${c.model||'MODELO NÃO DEFINIDO'}`;}

  function toggleTheme(){const root=document.documentElement;const cur=root.getAttribute('data-theme');if(cur==='dark')root.setAttribute('data-theme','light');else if(cur==='light')root.removeAttribute('data-theme');else root.setAttribute('data-theme','dark');}
  function resetToInput(){state.briefing=null;state.sourceText='';els.resultView.hidden=true;els.processingView.hidden=true;els.inputView.hidden=false;window.scrollTo({top:0,behavior:'smooth'});}
  function toast(msg){els.toast.textContent=msg;els.toast.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>els.toast.classList.remove('on'),2800);}
  async function copyText(t){await navigator.clipboard.writeText(t);toast('Briefing copiado.');}
  function downloadText(name,text,type){const blob=new Blob([text],{type:`${type};charset=utf-8`});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);}
  function formatBytes(n){if(n<1024)return`${n} B`;if(n<1024*1024)return`${(n/1024).toFixed(1)} KB`;return`${(n/1024/1024).toFixed(1)} MB`;}
  function isKeyReady(k){return k && !k.includes('COLE_SUA_CHAVE') && k.length>12;}
  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function escAttr(v){return esc(v).replace(/`/g,'&#096;');}
})();
