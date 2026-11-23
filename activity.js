(function (root) {
  'use strict';
  const countries = [
    { id: 1, name: '日本', english: 'JAPAN', focus: '介護保險（2000 年起）、訪問看護站、地域包括照護體系。比較需求評估、個案管理與社區整合。', source: '厚生勞動省：介護保險制度', url: 'https://www.mhlw.go.jp/content/12300000/000614772.pdf' },
    { id: 2, name: '韓國', english: 'SOUTH KOREA', focus: '老人長期療養保險（2008 年起）。探索亞洲另一個以社會保險辦理長照的國家，以及到宅服務的分工。', source: 'NHIS：長期療養保險給付', url: 'https://www.nhis.or.kr/english/wbheaa03200m01.do' },
    { id: 3, name: '德國', english: 'GERMANY', focus: '長照保險（1995 年起），可選現金給付、實物服務或混合使用。對照台灣長照的財源與家庭支持。', source: '德國聯邦健康資訊網：長照保險', url: 'https://gesund.bund.de/en/pflegeversicherung' },
    { id: 4, name: '英國（英格蘭）', english: 'ENGLAND', focus: '區分 NHS 的醫療與社區護理，以及地方政府的社會照顧。可從虛擬病房／Hospital at Home 探索在宅急症。', source: 'NHS England：虛擬病房', url: 'https://www.england.nhs.uk/virtual%20wards/' },
    { id: 5, name: '美國', english: 'UNITED STATES', focus: '比較 Medicare 的居家專業醫療給付與長期生活照顧的保障差異。注意不同保險與州別的適用範圍。', source: 'Medicare：居家健康照護', url: 'https://www.medicare.gov/coverage/home-health-services' },
    { id: 6, name: '丹麥', english: 'DENMARK', focus: '稅收支應、地方政府安排服務，強調整體照護與復能（reablement）。比較台灣居家服務及居家復能。', source: '丹麥政府：整體居家照護', url: 'https://lifeindenmark.borger.dk/healthcare/nursing-homes-and-elder-care/home-care' },
    { id: 7, name: '澳洲', english: 'AUSTRALIA', focus: 'Support at Home 於 2025 年 11 月 1 日取代 Home Care Packages 與短期復能照護方案。另確認 CHSP 的分階段整合時程。', source: '澳洲衛生部：Support at Home', url: 'https://www.health.gov.au/our-work/support-at-home/about?language=en' }
  ];
  const steps = [
    { title: '誰來評估', hint: '找出申請入口、評估人員與評估方式，不必找到與巴氏量表或 CMS 完全對應的工具。', fields: [
      ['assessmentSystem', '該國制度與申請方式', '去哪裡申請？由誰評估？用什麼方式判定需要？'],
      ['assessmentCase', '林奶奶會怎麼走', '第一步找誰？還需要補充林奶奶的哪些資料？']
    ] },
    { title: '誰來照護', hint: '以護理師角色及團隊分工為主；可另外查詢護理師能否獨立開業。', fields: [
      ['careSystem', '該國的服務提供與分工', '護理師、照顧人員及其他專業如何分工？'],
      ['careCase', '林奶奶會由誰照護', '壓力性損傷、導尿管及移位協助，分別由誰處理？']
    ] },
    { title: '誰付錢', hint: '說明社會保險、稅收或自費，只需舉一項代表性服務的自付方式，不必查完整費率。', fields: [
      ['fundingSystem', '該國財源與一項服務的自付', '選哪項服務？自付金額或比例是多少？資料是哪一年？'],
      ['fundingCase', '林奶奶可能的負擔', '套用已知情況；若收入、保險或資格未明，說明還需確認什麼。']
    ] },
    { title: '特色服務', hint: '選一項在宅急症、復能、遠距照護或安寧居家深入介紹，附上有年份的推行現況或執行困難。', fields: [
      ['featureSystem', '一項特色與推行現況', '政策或服務名稱、資料年份，以及實施成果或困難。'],
      ['featureCase', '與林奶奶的關係', '這項服務可能如何幫助她？目前是否適用？若不適用，請說明。']
    ] },
    { title: '與台灣比較', hint: '報告時，至少一半時間用於這一項。比較相同服務或需求，並說明理由；資料不足時不必勉強下結論。', fields: [
      ['taiwanPath', '林奶奶在台灣會怎麼走', '比較申請、評估、護理與生活照顧的銜接。'],
      ['learn', '台灣可借鏡之處與理由', '寫一項具體做法，解釋它回應什麼需要。'],
      ['retain', '台灣值得保留的做法與理由', '寫一項現有做法的優點；若無法判斷，請寫明原因。'],
      ['limits', '資料不足或仍需確認之處（選填）', '哪些比較受限於年份、州別、資格或資料缺漏？']
    ] }
  ];
  const fields = steps.flatMap(s => s.fields.map(f => f[0]));
  const required = fields.filter(f => f !== 'limits');
  const key = group => 'home-care-world-v1-group-' + group;
  function taipeiDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function blank(group) { return { schema: 'home-care-world-v1', group, className: '', members: '', answers: Object.fromEntries(fields.map(f => [f, ''])), sources: [{ name: '', url: '', date: taipeiDate(), type: 'official' }], savedAt: new Date().toISOString(), status: 'draft' }; }
  function cleanString(value, max) { if (typeof value !== 'string' || value.length > max) throw Error('欄位內容或長度不正確。'); return value; }
  function validUrl(value) { try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; } }
  function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const d = new Date(value + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value; }
  function validate(record) {
    if (!record || record.schema !== 'home-care-world-v1' || !Number.isInteger(record.group) || record.group < 1 || record.group > 7) throw Error('請選擇本活動匯出的 JSON 草稿或成果檔。');
    if (!record.answers || typeof record.answers !== 'object' || !Array.isArray(record.sources) || record.sources.length < 1 || record.sources.length > 10) throw Error('成果檔的欄位格式不正確。');
    const result = blank(record.group);
    result.className = cleanString(record.className, 100);
    result.members = cleanString(record.members, 300);
    result.answers = Object.fromEntries(fields.map(f => [f, cleanString(record.answers[f] ?? '', 3000)]));
    result.sources = record.sources.map(s => {
      if (!s || !['official', 'research', 'other'].includes(s.type)) throw Error('資料來源格式不正確。');
      const item = { name: cleanString(s.name, 200), url: cleanString(s.url, 2000), date: cleanString(s.date, 10), type: s.type };
      if (record.status === 'complete' && ((item.url && !validUrl(item.url)) || (item.date && !validDate(item.date)))) throw Error('來源網址或日期格式不正確。');
      return item;
    });
    if (typeof record.savedAt !== 'string' || !Number.isFinite(Date.parse(record.savedAt))) throw Error('成果檔的時間格式不正確。');
    result.savedAt = new Date(record.savedAt).toISOString();
    result.status = record.status === 'complete' ? 'complete' : 'draft';
    if (result.status === 'complete' && errors(result).length) throw Error('成果檔標示已完成，但有必填內容缺漏。');
    return result;
  }
  function errors(r) {
    const problems = [];
    for (const step of steps) for (const [id, label] of step.fields) if (required.includes(id) && !r.answers[id]?.trim()) problems.push({ id, message: '請填寫「' + label + '」。' });
    r.sources.forEach((s, i) => {
      if (!s.name.trim() || !validUrl(s.url) || !validDate(s.date)) problems.push({ id: 'source-' + i + '-name', message: '請完整填寫第 ' + (i + 1) + ' 筆來源的名稱、有效網址及查詢日期。' });
    });
    if (!r.sources.some(s => s.type === 'official' && s.name.trim() && validUrl(s.url) && validDate(s.date))) problems.push({ id: 'sourcesSection', message: '至少需要一筆完整的政府或官方網站來源。' });
    return problems;
  }
  function toMarkdown(r) {
    const country = countries[r.group - 1];
    const lines = ['# 第 ' + r.group + ' 組｜' + country.name + ' 居家照護制度比較', '', '班級：' + r.className, '組員：' + r.members, '狀態：' + (r.status === 'complete' ? '已完成' : '草稿'), '記錄時間：' + new Date(r.savedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), '', '共同個案：林奶奶，82 歲，獨居，中風後左側肢體無力，需協助移位，薦骨第二級壓力性損傷，留置導尿管。女兒白天上班，只能晚上探視。', ''];
    steps.forEach((s, i) => { lines.push('## ' + (i + 1) + '. ' + s.title, ''); s.fields.forEach(([f, label]) => lines.push('### ' + label, '', r.answers[f].trim() || '（尚未填寫）', '')); });
    lines.push('## 資料來源', '');
    r.sources.forEach((s, i) => lines.push((i + 1) + '. ' + (s.name || '未命名來源'), '   網址：' + s.url, '   查詢日期：' + s.date, '   類型：' + ({ official: '政府或官方網站', research: '學術研究', other: '其他' }[s.type]), ''));
    return lines.join('\n');
  }
  root.HomeCare = { countries, steps, fields, required, key, blank, validate, errors, validUrl, validDate, toMarkdown };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HomeCare;
})(typeof globalThis !== 'undefined' ? globalThis : window);
