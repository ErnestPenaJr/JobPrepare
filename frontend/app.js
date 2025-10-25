(function(){
  const $ = (sel) => document.querySelector(sel);
  const todayStr = new Date().toISOString().slice(0,10);
  const SETTINGS_KEY = 'jobs_settings_v1';
  function loadSettings(){
    try{ return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); }catch(_){ return {}; }
  }
  $('#today').textContent = `Today: ${todayStr}`;

  const els = {
    jdUrl: $('#jdUrl'),
    btnFetchUrl: $('#btnFetchUrl'),
    jdText: $('#jdText'),
    jdFile: $('#jdFile'),
    resumeText: $('#resumeText'),
    resumeFile: $('#resumeFile'),
    clText: $('#clText'),
    clFile: $('#clFile'),
    btnAnalyze: $('#btnAnalyze'),
    btnClear: $('#btnClear'),
    progress: $('#progress'),
    decision: $('#decision'),
    finalScore: $('#finalScore'),
    meterFill: $('#meterFill'),
    iterations: $('#iterations'),
    kwMatched: $('#kwMatched'),
    kwMissing: $('#kwMissing'),
    gaps: $('#gaps'),
    stopBox: $('#stopBox'),
    stopReasons: $('#stopReasons'),
    btnCover: $('#btnCover'),
    coverOut: $('#coverOut'),
    btnExportMd: $('#btnExportMd'),
    btnPrint: $('#btnPrint'),
    btnPurge: $('#btnPurge'),
    stability: $('#stability'),
  };

  // Helpers
  async function uploadFile(file){
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/upload', { method:'POST', body: fd });
    if(!res.ok) throw new Error('Upload failed');
    return await res.json();
  }

  function setProgress(on){ els.progress.classList.toggle('hidden', !on); }

  function renderResult(data){
    const { scorecard, gaps, keywords, decision, stop_conditions_triggered } = data;
    els.finalScore.textContent = scorecard.final_score?.toFixed ? scorecard.final_score.toFixed(1) : String(scorecard.final_score);
    const pct = Math.max(0, Math.min(1, (scorecard.final_score - 1) / 9));
    els.meterFill.style.width = `${pct*100}%`;
    els.decision.className = `banner ${decision === 'accept' ? 'accept' : 'reject'}`;
    els.decision.textContent = decision === 'accept' ? 'Accepted' : 'Rejected';

    els.iterations.innerHTML = '';
    (scorecard.iterations||[]).forEach((v,i)=>{
      const li = document.createElement('li');
      li.textContent = `#${i+1}: ${v.toFixed(1)}`;
      els.iterations.appendChild(li);
    });

    els.kwMatched.innerHTML = '';
    els.kwMissing.innerHTML = '';
    (keywords.matched||[]).forEach(k=>{ const li=document.createElement('li'); li.textContent=k; els.kwMatched.appendChild(li); });
    (keywords.missing||[]).forEach(k=>{ const li=document.createElement('li'); li.textContent=k; els.kwMissing.appendChild(li); });

    els.gaps.innerHTML = '';
    (gaps||[]).forEach(g=>{ const li=document.createElement('li'); li.textContent=g; els.gaps.appendChild(li); });

    if(stop_conditions_triggered && stop_conditions_triggered.length){
      els.stopReasons.innerHTML = '';
      stop_conditions_triggered.forEach(r=>{ const li=document.createElement('li'); li.textContent=r; els.stopReasons.appendChild(li); });
      els.stopBox.classList.remove('hidden');
    } else {
      els.stopBox.classList.add('hidden');
    }

    if (decision === 'accept' && scorecard.stability && scorecard.stability.delta <= 0.5) {
      els.btnCover.disabled = false;
      els.stability.textContent = `Re-eval: ${scorecard.stability.reeval_score.toFixed(2)} (Δ ${scorecard.stability.delta.toFixed(2)})`;
    } else {
      els.btnCover.disabled = true;
      els.stability.textContent = '';
    }

    els.btnExportMd.disabled = false;
    els.btnPrint.disabled = false;
  }

  async function analyze(){
    setProgress(true);
    try{
      const st = loadSettings();
      const body = {
        jd: { text: els.jdText.value },
        resume: { text: els.resumeText.value },
        coverLetter: els.clText.value ? { text: els.clText.value } : undefined,
        settings: {
          timezone: st.timezone || 'America/Chicago',
          today: todayStr,
          minFinalScore: typeof st.minFinalScore === 'number' ? st.minFinalScore : 8.0,
          stopKeywords: Array.isArray(st.stopKeywords) ? st.stopKeywords : undefined,
          checks: Array.isArray(st.checks) ? st.checks : undefined,
        }
      };
      const res = await fetch('/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const data = await res.json();
      renderResult(data);
    } catch(err){
      alert('Analyze failed: '+ err.message);
    } finally{
      setProgress(false);
    }
  }

  async function generateCover(){
    try{
      const st = loadSettings();
      const body = { jd:{text: els.jdText.value}, resume:{text: els.resumeText.value}, existingCoverLetter:{ text: els.clText.value }, settings:{ today: todayStr, timezone: st.timezone || 'America/Chicago' } };
      const res = await fetch('/cover-letter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const data = await res.json();
      els.coverOut.value = data.revisedCoverLetter || '';
    }catch(err){ alert('Cover letter failed: '+err.message); }
  }

  function exportMarkdown(){
    const doc = [];
    doc.push('# Analysis Report');
    doc.push('');
    doc.push(`Date: ${todayStr}`);
    doc.push('');
    doc.push(`Final Score: ${els.finalScore.textContent}`);
    doc.push('');
    doc.push('## Matched Keywords');
    doc.push([...els.kwMatched.querySelectorAll('li')].map(li=>`- ${li.textContent}`).join('\n') || '-');
    doc.push('');
    doc.push('## Missing Keywords');
    doc.push([...els.kwMissing.querySelectorAll('li')].map(li=>`- ${li.textContent}`).join('\n') || '-');
    doc.push('');
    doc.push('## Gaps');
    doc.push([...els.gaps.querySelectorAll('li')].map(li=>`- ${li.textContent}`).join('\n') || '-');
    const blob = new Blob([doc.join('\n')], {type:'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analysis-${todayStr}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function printReport(){ window.print(); }

  async function purge(){
    try{ await fetch('/delete-session', { method:'POST' }); }catch(_){ } 
    els.coverOut.value='';
    els.btnCover.disabled=true; els.btnExportMd.disabled=true; els.btnPrint.disabled=true;
  }

  // File inputs → textareas
  els.jdFile.addEventListener('change', async (e)=>{ const f=e.target.files[0]; if(!f) return; try{ const r=await uploadFile(f); els.jdText.value=r.text||''; }catch(err){ alert('JD upload failed'); } });
  els.resumeFile.addEventListener('change', async (e)=>{ const f=e.target.files[0]; if(!f) return; try{ const r=await uploadFile(f); els.resumeText.value=r.text||''; }catch(err){ alert('Resume upload failed'); } });
  els.clFile.addEventListener('change', async (e)=>{ const f=e.target.files[0]; if(!f) return; try{ const r=await uploadFile(f); els.clText.value=r.text||''; }catch(err){ alert('Cover letter upload failed'); } });

  // URL fetch (browser-side; CORS dependent on target)
  els.btnFetchUrl.addEventListener('click', async ()=>{
    const url = els.jdUrl.value.trim(); if(!url) return;
    try{
      const r = await fetch('/fetch-url', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      els.jdText.value = data.text || '';
    }catch(err){ alert('URL fetch failed; paste JD manually.'); }
  });

  // Actions
  els.btnAnalyze.addEventListener('click', analyze);
  els.btnCover.addEventListener('click', generateCover);
  els.btnExportMd.addEventListener('click', exportMarkdown);
  els.btnPrint.addEventListener('click', printReport);
  els.btnPurge.addEventListener('click', purge);
  els.btnClear.addEventListener('click', ()=>{ els.jdText.value=''; els.resumeText.value=''; els.clText.value=''; });
})();
