(function () {
  'use strict';
  const H = window.HomeCare;
  const $ = id => document.getElementById(id);
  const create = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  let group = 0;
  let state = null;
  let completedRecord = null;
  let storageAvailable = true;
  function storageGet(key) { try { return localStorage.getItem(key); } catch { storageAvailable = false; return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); return true; } catch { storageAvailable = false; return false; } }
  function storedRecord(id) {
    const raw = storageGet(H.key(id));
    if (!raw) return H.blank(id);
    try { const record = H.validate(JSON.parse(raw)); if (record.group !== id) throw Error('組別不符'); return record; }
    catch { $('importStatus').textContent = '這組先前的草稿無法讀取。若有下載備份，可重新匯入。'; return H.blank(id); }
  }
  function recordFromForm() {
    return { schema: 'home-care-world-v1', group, className: $('className').value, members: $('members').value,
      answers: Object.fromEntries(H.fields.map(f => [f, $(f).value])),
      sources: Array.from($('sourceRows').children).map(row => Object.fromEntries(['name', 'url', 'date', 'type'].map(f => [f, row.querySelector('[data-field="' + f + '"]').value]))),
      savedAt: new Date().toISOString(), status: 'draft' };
  }
  function persist(record) {
    const saved = storageSet(H.key(record.group), JSON.stringify(record));
    storageSet('home-care-world-v1-selected', String(record.group));
    $('saveStatus').textContent = saved && storageAvailable ? '草稿已儲存在此瀏覽器 · ' + new Date(record.savedAt).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' }) : '此瀏覽器無法儲存草稿，請下載備份。';
  }
  function updateProgress(record) {
    const count = H.required.filter(f => record.answers[f].trim()).length;
    $('progress').value = count;
    $('progressText').textContent = '已填寫 ' + count + ' / ' + H.required.length + ' 個必填欄位';
  }
  function drawPreview(record, target) {
    target.replaceChildren();
    const meta = [record.className && '班級：' + record.className, record.members && '組員：' + record.members].filter(Boolean).join('　');
    if (meta) target.append(create('p', meta, 'preview-meta'));
    H.steps.forEach((step, i) => {
      const section = create('section', undefined, 'preview-section');
      section.append(create('h3', (i + 1) + '. ' + step.title));
      step.fields.forEach(([id, label]) => { section.append(create('h4', label), create('p', record.answers[id].trim() || '尚未填寫', 'answer-text' + (record.answers[id].trim() ? '' : ' unfilled'))); });
      target.append(section);
    });
    const sources = create('section', undefined, 'preview-section');
    sources.append(create('h3', '資料來源'));
    record.sources.forEach((source, i) => {
      const item = create('div', undefined, 'source-item');
      item.append(create('p', (i + 1) + '. ' + (source.name || '尚未填寫來源名稱')));
      if (H.validUrl(source.url)) { const link = create('a', source.url); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); }
      else if (source.url) item.append(create('p', source.url, 'hint'));
      item.append(create('p', '查詢日期：' + (source.date || '尚未填寫') + ' · ' + ({ official: '政府或官方網站', research: '學術研究', other: '其他' }[source.type]), 'hint'));
      sources.append(item);
    });
    target.append(sources);
  }
  function changed() {
    if (!group) return;
    state = recordFromForm(); persist(state); updateProgress(state); drawPreview(state, $('livePreview'));
    $('result').hidden = true; completedRecord = null; $('formError').textContent = '';
  }
  function buildQuestions() {
    H.steps.forEach((step, i) => {
      const section = create('section', undefined, 'form-section' + (i === 4 ? ' comparison-section' : ''));
      section.id = 'step' + (i + 1);
      section.append(create('p', '討論 ' + (i + 1), 'eyebrow'), create('h2', step.title), create('p', step.hint, 'hint'));
      step.fields.forEach(([id, label, placeholder]) => {
        const field = create('label', undefined, 'answer-field'); field.htmlFor = id;
        const title = create('span', label, 'field-label');
        if (H.required.includes(id)) title.append(create('span', '必填', 'required-note'));
        const input = create('textarea'); input.id = id; input.name = id; input.rows = 4; input.maxLength = 3000; input.placeholder = placeholder;
        input.required = H.required.includes(id);
        field.append(title, input); section.append(field);
      });
      $('questionFields').append(section);
    });
  }
  function renderSources(sources) {
    $('sourceRows').replaceChildren();
    sources.forEach((source, i) => {
      const row = create('div', undefined, 'source-row');
      const heading = create('div', undefined, 'source-actions'); heading.append(create('h3', '來源 ' + (i + 1)));
      if (sources.length > 1) { const remove = create('button', '移除此來源', 'text-button'); remove.type = 'button'; remove.addEventListener('click', () => { const current = recordFromForm(); current.sources.splice(i, 1); renderSources(current.sources); changed(); }); heading.append(remove); }
      row.append(heading);
      const nameLabel = create('label', '來源名稱'); const name = create('input'); name.id = 'source-' + i + '-name'; name.dataset.field = 'name'; name.maxLength = 200; name.value = source.name; name.placeholder = '政府機關、報告或網頁標題'; nameLabel.htmlFor = name.id; nameLabel.append(name); row.append(nameLabel);
      const urlLabel = create('label', '網址'); const url = create('input'); url.id = 'source-' + i + '-url'; url.dataset.field = 'url'; url.type = 'url'; url.maxLength = 2000; url.value = source.url; url.placeholder = 'https://'; urlLabel.htmlFor = url.id; urlLabel.append(url); row.append(urlLabel);
      const pair = create('div', undefined, 'two-columns');
      const dateLabel = create('label', '查詢日期'); const date = create('input'); date.id = 'source-' + i + '-date'; date.dataset.field = 'date'; date.type = 'date'; date.value = source.date; dateLabel.htmlFor = date.id; dateLabel.append(date);
      const typeLabel = create('label', '來源類型'); const type = create('select'); type.id = 'source-' + i + '-type'; type.dataset.field = 'type'; typeLabel.htmlFor = type.id;
      for (const [value, text] of Object.entries({ official: '政府或官方網站', research: '學術研究', other: '其他' })) { const option = create('option', text); option.value = value; type.append(option); }
      type.value = source.type; typeLabel.append(type); pair.append(dateLabel, typeLabel); row.append(pair); $('sourceRows').append(row);
    });
    $('addSource').disabled = sources.length >= 10;
  }
  function selectGroup(id, record) {
    group = id; state = record || storedRecord(id); completedRecord = null;
    const country = H.countries[id - 1];
    $('workArea').hidden = false;
    $('groupLabel').textContent = '第 ' + id + ' 組 · ' + country.english;
    $('countryTitle').textContent = country.name; $('countryFocus').textContent = country.focus;
    $('officialLink').textContent = country.source; $('officialLink').href = country.url;
    document.querySelectorAll('.group-button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.group) === id)));
    $('className').value = state.className; $('members').value = state.members;
    H.fields.forEach(f => { $(f).value = state.answers[f]; });
    renderSources(state.sources); updateProgress(state); drawPreview(state, $('livePreview'));
    $('result').hidden = true; $('formError').textContent = '';
    persist(state);
    if (state.status === 'complete' && !H.errors(state).length) showResult(state, false);
  }
  function showResult(record, scroll) {
    completedRecord = H.validate(record);
    $('resultTitle').textContent = '第 ' + record.group + ' 組｜' + H.countries[record.group - 1].name + ' 居家照護制度比較';
    $('resultMeta').textContent = '完成時間：' + new Date(record.savedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    drawPreview(record, $('resultContent')); $('result').hidden = false;
    if (scroll) { $('result').scrollIntoView({ behavior: 'smooth' }); $('result').focus({ preventScroll: true }); }
  }
  function download(text, mime, extension, record) {
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = create('a'); link.href = url;
    link.download = '居家照護比較-第' + record.group + '組-' + H.countries[record.group - 1].name + (record.status === 'draft' ? '-草稿' : '-成果') + '.' + extension;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  buildQuestions();
  H.countries.forEach(country => {
    const button = create('button', undefined, 'group-button'); button.type = 'button'; button.dataset.group = country.id; button.setAttribute('aria-pressed', 'false');
    button.append(create('small', '第 ' + country.id + ' 組'), create('b', country.name)); button.addEventListener('click', () => { $('importStatus').textContent = ''; selectGroup(country.id); }); $('groupPicker').append(button);
  });
  $('activityForm').addEventListener('input', changed);
  $('activityForm').addEventListener('change', changed);
  $('activityForm').addEventListener('submit', event => {
    event.preventDefault(); if (!group) return;
    const record = recordFromForm(); const errors = H.errors(record);
    if (errors.length) { $('formError').textContent = errors[0].message; const field = $(errors[0].id); if (field) { field.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (typeof field.focus === 'function') field.focus({ preventScroll: true }); } return; }
    record.status = 'complete'; state = record; persist(record); showResult(record, true);
  });
  $('addSource').addEventListener('click', () => { const record = recordFromForm(); if (record.sources.length >= 10) return; record.sources.push(H.blank(group).sources[0]); renderSources(record.sources); changed(); $('source-' + (record.sources.length - 1) + '-name').focus(); });
  $('exportDraft').addEventListener('click', () => { const record = recordFromForm(); persist(record); download(JSON.stringify(record, null, 2), 'application/json', 'json', record); });
  $('downloadJson').addEventListener('click', () => { if (completedRecord) download(JSON.stringify(completedRecord, null, 2), 'application/json', 'json', completedRecord); });
  $('downloadText').addEventListener('click', () => { if (completedRecord) download('\uFEFF' + H.toMarkdown(completedRecord), 'text/plain', 'txt', completedRecord); });
  $('printResult').addEventListener('click', () => { if (completedRecord) window.print(); });
  $('editResult').addEventListener('click', () => { $('activityForm').scrollIntoView({ behavior: 'smooth' }); $('className').focus({ preventScroll: true }); });
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 128 * 1024) throw Error('檔案過大，請選擇本活動匯出的 JSON 檔。');
      const imported = H.validate(JSON.parse((await file.text()).replace(/^\uFEFF/, '')));
      const current = storedRecord(imported.group);
      if ((H.fields.some(f => current.answers[f].trim()) || current.className || current.members || current.sources.some(s => s.name || s.url)) && !window.confirm('匯入將取代第 ' + imported.group + ' 組在此瀏覽器的草稿。請先確認已下載需要保留的版本。是否繼續？')) return;
      if (group && group !== imported.group) persist(recordFromForm());
      selectGroup(imported.group, imported); $('importStatus').textContent = '已匯入第 ' + imported.group + ' 組的' + (imported.status === 'complete' ? '成果' : '草稿') + '，可繼續修改。';
      $('workspace').scrollIntoView({ behavior: 'smooth' });
    } catch (error) { $('importStatus').textContent = error instanceof SyntaxError ? '無法讀取 JSON，請選擇本活動匯出的檔案。' : error.message; }
    finally { event.target.value = ''; }
  });
  const selected = Number(storageGet('home-care-world-v1-selected'));
  if (Number.isInteger(selected) && selected >= 1 && selected <= 7) selectGroup(selected);
})();
