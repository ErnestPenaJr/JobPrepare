(function(){
  const $ = (s)=> document.querySelector(s);
  const KEY = 'jobs_settings_v1';

  const defaults = {
    timezone: 'America/Chicago',
    minFinalScore: 8.0,
    stopKeywords: [
      'manufacturing','plant','factory','warehouse','warehousing','industrial','supply chain operations','logistics'
    ],
    checks: ['jdKeywords','minScore','yrs8','mgmt5','architectNoIC','legacy','locationNoRemote','devopsOnly','qaOnly','pmOnly']
  };

  function load(){
    try{ return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(_){ return {...defaults}; }
  }
  function save(v){ localStorage.setItem(KEY, JSON.stringify(v)); }

  const s = load();
  $('#timezone').value = s.timezone;
  $('#minFinalScore').value = s.minFinalScore;
  $('#stopKeywords').value = (s.stopKeywords||[]).join(', ');
  $('#checksList').value = (s.checks||defaults.checks).join(', ');

  $('#save').addEventListener('click', ()=>{
    const out = {
      timezone: $('#timezone').value.trim() || defaults.timezone,
      minFinalScore: parseFloat($('#minFinalScore').value) || defaults.minFinalScore,
      stopKeywords: $('#stopKeywords').value.split(',').map(x=>x.trim()).filter(Boolean),
    };
    const allowed = new Set(['jdKeywords','minScore','yrs8','mgmt5','architectNoIC','legacy','locationNoRemote','devopsOnly','qaOnly','pmOnly']);
    out.checks = $('#checksList').value.split(',').map(x=>x.trim()).filter(x=>allowed.has(x));
    if (!out.checks.length) out.checks = defaults.checks;
    save(out);
    const saved = document.getElementById('saved');
    saved.classList.remove('hidden');
    setTimeout(()=> saved.classList.add('hidden'), 1200);
  });
})();
