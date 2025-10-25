const DEFAULT_STOP_KW = [
  'manufacturing','plant','factory','warehouse','warehousing','industrial',
  'supply chain operations','logistics',
];

function wordInText(word, text) { const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i'); return pattern.test(text || ''); }
function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');}
function parseRequiredYears(jd){ const y = jd && jd.experience_bounds && jd.experience_bounds.min_years; if (typeof y === 'number' && y > 0) return y; if (!jd || !jd.full_text) return null; const m = jd.full_text.match(/(\d{1,2})\s*\+?\s*years/i); return m ? Number(m[1]) : null; }
function requiresMinYears(jd, threshold) { const req = parseRequiredYears(jd); if (req == null) return false; return req >= (typeof threshold === 'number' ? threshold : 8); }
function parseMgmtDirectReports(jd){ if (!jd || !jd.full_text) return null; const m = jd.full_text.match(/(\d{1,2})\s*\+?\s*(?:direct\s*)?reports/i) || jd.full_text.match(/team\s+of\s+(\d{1,2})/i); return m ? Number(m[1]) : null; }
function requiresMgmtThreshold(jd, threshold){ const req = parseMgmtDirectReports(jd); if (req == null) return false; return req >= (typeof threshold === 'number' ? threshold : 5); }
function architectWithoutIC(jd) { if (!jd || !jd.full_text) return false; return /(architect)\b/i.test(jd.full_text) && !/individual\s+contributor|IC/i.test(jd.full_text); }
function primaryLegacyStack(jd) { if (!jd || !jd.full_text) return false; return /(mainframe|cobol|vb6|silverlight|powerbuilder|foxpro|delphi)\b/i.test(jd.full_text); }
function parseOnsiteDays(jd) { if (!jd || !jd.full_text) return false; const txt = jd.full_text.toLowerCase(); const daysM = txt.match(/(\d)\s*days?\s*(?:per|\/)?\s*week[^\n]*on[- ]?site/); const days = daysM ? Number(daysM[1]) : (/(monday.*friday.*on[- ]?site)/.test(txt) ? 5 : null); return days; }
function locationDisqualifier(jd, onsiteDaysStop) { if (!jd || !jd.full_text) return false; const txt = jd.full_text.toLowerCase(); const caNy = /(california|\bca\b|new\s+york|\bny\b)/.test(txt); const days = parseOnsiteDays(jd); const noRemote = /(no\s*remote|on[- ]site\s*only)/.test(txt); const stopDays = typeof onsiteDaysStop === 'number' ? onsiteDaysStop : 5; const daysStop = days != null && days >= stopDays; return (caNy || daysStop) && noRemote; }
function roleCategoryOnly(jd, cat) { if (!jd || !jd.full_text) return false; const t = jd.full_text.toLowerCase(); if (cat === 'devops') return /devops|infrastructure/.test(t) && !/developer|engineer/.test(t); if (cat === 'qa') return /qa|quality\s+assurance/.test(t) && !/developer|engineer/.test(t); if (cat === 'pm') return /project\s+manager|scrum\s+master/.test(t) && !/developer|engineer/.test(t); return false; }
function stopConditions(finalScore, jd, candidate, cfg = {}) {
  const reasons = [];
  const details = {};
  const checks = Object.assign({
    jdKeywords: true,
    minScore: true,
    yrs8: true,
    mgmt5: true,
    architectNoIC: true,
    legacy: true,
    locationNoRemote: true,
    devopsOnly: true,
    qaOnly: true,
    pmOnly: true,
    clearance: true,
    physicalOnly: true,
    complianceOnly: true,
    grcOnly: true,
  }, cfg.checks || {});

  const minScore = typeof cfg.minFinalScore === 'number' ? cfg.minFinalScore : 8.0;
  const thresholds = Object.assign({ yearsMinRequiredStop: 8, managementRequiredStop: 5, onsiteDaysStop: 5 }, cfg.thresholds || {});

  const fullText = (jd && jd.full_text) || '';
  const lower = fullText.toLowerCase();

  // Stop keywords with context exceptions
  const baseStops = Array.isArray(cfg.stopKeywords) && cfg.stopKeywords.length ? cfg.stopKeywords : DEFAULT_STOP_KW;
  let foundKw = baseStops.filter((w)=> wordInText(w, fullText));
  // OT/SCADA/industrial controls are disqualifiers unless clearly in a cyber/IT security context.
  const extraTerms = ['ot', 'operational technology', 'scada', 'industrial controls'];
  for (const term of extraTerms){
    if (wordInText(term, fullText)){
      const idx = lower.indexOf(term);
      const context = lower.slice(Math.max(0, idx - 40), idx + 40);
      const inSecurity = /(cyber|it\s*security|security\s+(engineer|analyst|operations|architect))/i.test(context);
      if (!inSecurity) foundKw.push(term);
    }
  }
  if (checks.jdKeywords && foundKw.length) reasons.push('jd_disqualify_keywords');
  if (foundKw.length) details.stop_keywords_found = [...new Set(foundKw)];

  // Score threshold
  if (checks.minScore && finalScore < minScore) reasons.push('final_score_below_8');
  details.min_score = { final: finalScore, threshold: minScore };

  // Years / Management thresholds
  const reqYears = parseRequiredYears(jd);
  if (checks.yrs8 && requiresMinYears(jd, thresholds.yearsMinRequiredStop)) reasons.push('requires_min_years');
  details.years = { required: reqYears, threshold: thresholds.yearsMinRequiredStop };
  const reqMgmt = parseMgmtDirectReports(jd);
  if (checks.mgmt5 && requiresMgmtThreshold(jd, thresholds.managementRequiredStop)) reasons.push('requires_direct_reports_threshold');
  details.management = { required: reqMgmt, threshold: thresholds.managementRequiredStop };

  // Other general checks
  if (checks.architectNoIC && architectWithoutIC(jd)) reasons.push('architect_without_ic');
  if (checks.legacy && primaryLegacyStack(jd)) reasons.push('legacy_stack');

  // Location / Onsite
  const locDays = parseOnsiteDays(jd);
  const caNy = /(california|\bca\b|new\s+york|\bny\b)/.test(lower);
  const noRemote = /(no\s*remote|on[- ]site\s*only)/.test(lower);
  if (checks.locationNoRemote && locationDisqualifier(jd, thresholds.onsiteDaysStop)) reasons.push('location_no_remote');
  details.onsite = { days: locDays, threshold: thresholds.onsiteDaysStop, ca_or_ny: caNy, no_remote: noRemote };

  // Security clearance (reject if required and not present in candidate text)
  if (checks.clearance) {
    const requiresClearance = /(ts\/?sci|ts\s*sci|top\s*secret|secret\s+clearance)/i.test(lower);
    if (requiresClearance) {
      const candTxt = (candidate && candidate.full_text || '').toLowerCase();
      const hasClearance = /(ts\/?sci|ts\s*sci|top\s*secret|secret\s+clearance)/i.test(candTxt);
      if (!hasClearance) reasons.push('requires_security_clearance');
    }
  }

  // Role focus disqualifiers
  function lacksTechnicalContext(){ return !/(engineer|developer|software|system|network|security\s+(engineer|analyst|architect))/i.test(lower); }
  if (checks.physicalOnly && /physical\s+security/i.test(lower) && lacksTechnicalContext()) reasons.push('physical_security_only');
  if (checks.complianceOnly && /(compliance|audit|sox|hipaa|pci)/i.test(lower) && lacksTechnicalContext()) reasons.push('compliance_only');
  if (checks.grcOnly && /(governance|risk\s+management|grc)/i.test(lower) && lacksTechnicalContext()) reasons.push('grc_only');

  // Non-dev roles
  if ((checks.devopsOnly && roleCategoryOnly(jd, 'devops')) || (checks.qaOnly && roleCategoryOnly(jd, 'qa')) || (checks.pmOnly && roleCategoryOnly(jd, 'pm'))) reasons.push('non_dev_role');

  return { triggered: reasons.length > 0, reasons, details };
}

module.exports = { stopConditions, DEFAULT_STOP_KW };
