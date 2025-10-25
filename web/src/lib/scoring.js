// Scoring engine (JD-driven iterations)
const { synonymize } = require('./synonyms');

// Stop words to exclude from word comparison
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
  'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
  'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some',
  'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having', 'may', 'should',
  'am', 'being', 'such', 'through', 'where', 'much', 'before', 'right', 'too', 'does', 'very', 'off', 'need', 'three',
  'must', 'more', 'own', 'while', 'here', 'each', 'both', 'between', 'under', 'those', 'during', 'without', 'however',
  'per', 'within', 'including', 'using', 'based', 'across', 'around', 'along', 'among', 'toward', 'towards', 'upon'
]);

function normalizeYears(years) { const y = Math.max(0, Math.min(20, Number(years || 0))); return y / 20; }
function tokenize(text) { return (text || '').toLowerCase(); }
function hasSkill(candidate, skill) {
  const skills = new Set((candidate.skills || []).map((s) => s.toLowerCase()));
  const frameworks = new Set((candidate.frameworks || []).map((s) => s.toLowerCase()));
  const tokens = tokenize(candidate.full_text || '');
  const syns = synonymize(skill);
  return syns.some((s) => skills.has(s) || frameworks.has(s) || tokens.includes(s)) ? 1 : 0;
}
function hasAny(candidate, arr) { return arr.some((a) => hasSkill(candidate, a)) ? 1 : 0; }
function hasDomainOverlap(candidate, jd) { const c = new Set((candidate.domains || []).map((d) => d.toLowerCase())); const j = new Set((jd.domain || []).map((d) => d.toLowerCase())); return [...c].some((d) => j.has(d)) ? 1 : 0; }
function constraintsOk(candidate, jd) { const onsiteReq = jd.location && jd.location.onsite; const days = jd.location && jd.location.days_on_site; const candOnsite = candidate.location && candidate.location.onsite; if (onsiteReq && days >= 5 && !candOnsite) return 0; return 1; }
function yearsOverall(candidate) { return normalizeYears(candidate.years_overall || 0); }

function has(str, term){ return (str || '').toLowerCase().includes(String(term).toLowerCase()); }

function buildWeightsets(jd, candidate){
  const labels = [];
  const sets = [];

  // Helper to normalize a weight object so that weights sum to 1
  function norm(obj){
    const sum = Object.values(obj).reduce((a,b)=> a + (b||0), 0) || 1;
    const out = {};
    for (const k of Object.keys(obj)) out[k] = (obj[k]||0) / sum;
    return out;
  }

  // Pass 1: Python/Django Focus
  sets.push(norm({ python: 0.35, django: 0.25, api: 0.2, sql: 0.2 }));
  labels.push('Python/Django Focus');

  // Pass 2: Backend Depth (resume skills weighted against JD demand)
  const primary = Array.isArray(jd?.primary_stack) ? jd.primary_stack.map((s)=> String(s).toLowerCase()) : [];
  const musts = new Set(((jd?.requirements?.must_have) || []).map((s)=> String(s).toLowerCase()));
  const prefs = new Set(((jd?.requirements?.nice_to_have) || []).map((s)=> String(s).toLowerCase()));
  const cSkills = new Set([...(candidate?.skills||[]), ...(candidate?.frameworks||[])]
    .map((s)=> String(s).toLowerCase()));

  function present(nameAliases){
    return nameAliases.some((n)=> hasSkill(candidate, n));
  }
  function freq(nameAliases){
    const text = (candidate?.full_text || '').toLowerCase();
    let count = 0;
    for (const n of nameAliases){
      const syns = synonymize(n);
      for (const s of syns){
        const re = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\b`, 'g');
        const m = text.match(re);
        count += m ? m.length : 0;
      }
    }
    return count;
  }
  function jdBoost(nameAliases){
    const inPrimary = nameAliases.some((n)=> primary.includes(n));
    const inMust = nameAliases.some((n)=> musts.has(n));
    const inPref = nameAliases.some((n)=> prefs.has(n));
    if (inPrimary || inMust) return 2.0;
    if (inPref) return 1.5;
    return 1.0;
  }

  const stackWeights = {};
  const featureDefs = [
    { key: 'python', aliases: ['python'] },
    { key: 'django', aliases: ['django'] },
    { key: 'sql', aliases: ['sql','ms-sql','sql server','t-sql','pl/sql','transact-sql'] },
    { key: 'api', aliases: ['api','json'] },
    { key: 'web_overlap', aliases: ['javascript','typescript','node'] },
    // Cloud/BI
    { key: 'azure', aliases: ['azure'] },
    { key: 'aws', aliases: ['aws','amazon web services'] },
    { key: 'gcp', aliases: ['gcp','google cloud','google cloud platform'] },
    { key: 'powerbi', aliases: ['power bi','powerbi'] },
    { key: 'tableau', aliases: ['tableau'] },
    // Data/ETL
    { key: 'airflow', aliases: ['airflow','apache airflow'] },
    { key: 'dbt', aliases: ['dbt','data build tool'] },
    { key: 'pandas', aliases: ['pandas'] },
    { key: 'numpy', aliases: ['numpy'] },
    { key: 'scikit', aliases: ['scikit-learn','sklearn','scikit'] },
    // DevOps
    { key: 'docker', aliases: ['docker'] },
    { key: 'kubernetes', aliases: ['kubernetes','k8s'] },
    { key: 'terraform', aliases: ['terraform'] },
    // Datastores
    { key: 'postgres', aliases: ['postgres','postgresql'] },
    { key: 'mysql', aliases: ['mysql'] },
    { key: 'oracle', aliases: ['oracle','oracle db'] },
    { key: 'mongodb', aliases: ['mongodb','mongo'] },
    // Messaging
    { key: 'kafka', aliases: ['kafka','apache kafka'] },
    { key: 'rabbitmq', aliases: ['rabbitmq'] },
    // FE/BE frameworks
    { key: 'react', aliases: ['react','reactjs','react.js'] },
    { key: 'vue', aliases: ['vue','vuejs','vue.js'] },
    { key: 'angular', aliases: ['angular','angularjs'] },
    { key: 'nodejs', aliases: ['node','nodejs','node.js'] },
    { key: 'express', aliases: ['express','express.js'] },
    { key: 'java', aliases: ['java'] },
    { key: 'spring', aliases: ['spring','spring boot','springboot'] },
    { key: 'dotnet', aliases: ['.net','dotnet'] },
    // Office
    { key: 'excel', aliases: ['excel','microsoft excel'] },
  ];
  for (const f of featureDefs){
    if (present(f.aliases)){
      const base = jdBoost(f.aliases);
      const mentions = freq(f.aliases);
      const density = 1 + Math.min(3, Math.log2(1 + mentions));
      stackWeights[f.key] = (stackWeights[f.key] || 0) + base * density;
    }
  }
  // Normalize; fallback if nothing present
  let swSum = Object.values(stackWeights).reduce((a,b)=> a+b, 0);
  if (swSum <= 0){
    Object.assign(stackWeights, { python: 1, django: 1, sql: 1, api: 1 });
    swSum = 4;
  }
  Object.keys(stackWeights).forEach((k)=> stackWeights[k] = stackWeights[k] / swSum);
  sets.push(stackWeights);
  labels.push('Backend Depth');

  // Pass 3: Data/Modeling
  sets.push(norm({ pandas: 0.25, numpy: 0.15, scikit: 0.2, sql: 0.2, timeseries: 0.1, regression: 0.1 }));
  labels.push('Data/Modeling');

  // Pass 4: Cloud/BI
  sets.push(norm({ azure: 0.25, aws: 0.1, gcp: 0.1, powerbi: 0.2, tableau: 0.1, dbt: 0.1, airflow: 0.15 }));
  labels.push('Cloud/BI');

  // Pass 5: Transferability
  sets.push(norm({ web_overlap: 0.3, xfer: 0.25, migrations: 0.25, selflearn: 0.2 }));
  labels.push('Transferability');

  // Pass 6: Domain Fit
  sets.push(norm({ domain: 0.7, constraints: 0.3 }));
  labels.push('Domain Fit');

  // Pass 7: Experience Tenure
  sets.push(norm({ genexp: 0.5, tenure: 0.2, years: 0.3 }));
  labels.push('Experience Tenure');

  // Pass 8: Keyword Match Strict
  sets.push(norm({ must_have: 0.8, preferred: 0.2 }));
  labels.push('Keyword Match Strict');

  // Pass 9: Learning Agility
  sets.push(norm({ selflearn: 0.5, process: 0.25, stakeholder: 0.25 }));
  labels.push('Learning Agility');

  // Pass 10: Holistic
  sets.push(norm({ must_have: 0.3, preferred: 0.1, domain: 0.1, genexp: 0.15, web_overlap: 0.1, api: 0.1, sql: 0.1, cloud_bi: 0.05 }));
  labels.push('Holistic');

  return { sets, labels };
}

function subscores(candidate, jd) {
  const subs = {
    python: hasSkill(candidate, 'python'),
    django: hasSkill(candidate, 'django'),
    data_stats: hasAny(candidate, ['time series', 'regression', 'r', 'sas', 'eviews']),
    cloud_bi: hasAny(candidate, ['azure', 'power bi']),
    sql: hasAny(candidate, ['sql', 'ms-sql', 'pl/sql', 't-sql', 'transact-sql', 'sql server']),
    api: hasAny(candidate, ['api', 'json']),
    genexp: yearsOverall(candidate),
    domain: hasDomainOverlap(candidate, jd),
    constraints: constraintsOk(candidate, jd),
    timeseries: hasAny(candidate, ['time series', 'time-series']),
    regression: hasAny(candidate, ['regression']),
    stats_pkgs: hasAny(candidate, ['r', 'sas', 'eviews']),
    azure: hasSkill(candidate, 'azure'),
    powerbi: hasSkill(candidate, 'power bi'),
    web_overlap: hasAny(candidate, ['javascript', 'typescript', 'node', 'api']),
    process: hasAny(candidate, ['sdlc', 'agile', 'scrum']),
    stakeholder: hasAny(candidate, ['stakeholder', 'ux', 'product']),
    tenure: yearsOverall(candidate),
    recency: 1,
    must_have: matchMustHave(candidate, jd),
    preferred: matchPreferred(candidate, jd),
    years: yearsMeet(candidate, jd),
    xfer: hasAny(candidate, ['c#', 'php', 'java', 'javascript']),
    migrations: hasAny(candidate, ['migration', 'rewrite', 'porting']),
    selflearn: hasAny(candidate, ['self', 'learn', 'course', 'cert']),
    // Expanded stack & tooling
    aws: hasSkill(candidate, 'aws'),
    gcp: hasSkill(candidate, 'gcp'),
    docker: hasSkill(candidate, 'docker'),
    kubernetes: hasSkill(candidate, 'kubernetes'),
    terraform: hasSkill(candidate, 'terraform'),
    postgres: hasAny(candidate, ['postgres','postgresql']),
    mysql: hasSkill(candidate, 'mysql'),
    oracle: hasSkill(candidate, 'oracle'),
    mongodb: hasSkill(candidate, 'mongodb'),
    kafka: hasSkill(candidate, 'kafka'),
    rabbitmq: hasSkill(candidate, 'rabbitmq'),
    tableau: hasSkill(candidate, 'tableau'),
    dbt: hasSkill(candidate, 'dbt'),
    airflow: hasSkill(candidate, 'airflow'),
    pandas: hasSkill(candidate, 'pandas'),
    numpy: hasSkill(candidate, 'numpy'),
    scikit: hasAny(candidate, ['scikit','sklearn','scikit-learn']),
    react: hasSkill(candidate, 'react'),
    vue: hasSkill(candidate, 'vue'),
    angular: hasSkill(candidate, 'angular'),
    nodejs: hasAny(candidate, ['node','node.js','nodejs']),
    express: hasSkill(candidate, 'express'),
    java: hasSkill(candidate, 'java'),
    spring: hasSkill(candidate, 'spring'),
    dotnet: hasAny(candidate, ['.net','dotnet']),
    excel: hasSkill(candidate, 'excel'),
  };
  return subs;
}
function pctMatch(candidate, list) { if (!list || list.length === 0) return 0; const matched = list.filter((w) => hasSkill(candidate, w)).length; return matched / list.length; }
function matchMustHave(candidate, jd) { return pctMatch(candidate, (jd.requirements && jd.requirements.must_have) || []); }
function matchPreferred(candidate, jd) { return pctMatch(candidate, (jd.requirements && jd.requirements.nice_to_have) || []); }
function yearsMeet(candidate, jd) { const min = (jd.experience_bounds && jd.experience_bounds.min_years) || 0; const ok = (candidate.years_overall || 0) >= min ? 1 : 0; return ok; }
function evaluate(candidate, jd, weights) { const subs = subscores(candidate, jd); let total = 0; for (const k of Object.keys(weights)) { total += (weights[k] || 0) * (subs[k] || 0); } return 1 + 9 * Math.max(0, Math.min(1, total)); }
function perturb(weights, pct = 0.1) { const out = {}; for (const k of Object.keys(weights)) { const w = weights[k]; const delta = (Math.random() * 2 - 1) * pct * w; out[k] = Math.max(0, w + delta); } const sum = Object.values(out).reduce((a, b) => a + b, 0) || 1; for (const k of Object.keys(out)) out[k] = out[k] / sum; return out; }

// Extract meaningful words from text (alphanumeric, 3+ chars, not stop words)
function extractWords(text) {
  if (!text) return [];
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s+#.-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && /[a-z]/.test(w));
  return words;
}

// Find common words between JD and resume with frequency counts
function findCommonWords(jdText, resumeText) {
  const jdWords = extractWords(jdText);
  const resumeWords = extractWords(resumeText);
  
  // Count frequencies
  const jdFreq = {};
  const resumeFreq = {};
  
  jdWords.forEach(w => jdFreq[w] = (jdFreq[w] || 0) + 1);
  resumeWords.forEach(w => resumeFreq[w] = (resumeFreq[w] || 0) + 1);
  
  // Find common words
  const common = [];
  for (const word in jdFreq) {
    if (resumeFreq[word]) {
      common.push({
        word,
        jd_count: jdFreq[word],
        resume_count: resumeFreq[word],
        total: jdFreq[word] + resumeFreq[word]
      });
    }
  }
  
  // Sort by total frequency (most common first)
  common.sort((a, b) => b.total - a.total);
  
  return common;
}

// Run 10 iterations of word comparison scoring
function wordComparisonScore(jdText, resumeText) {
  const commonWords = findCommonWords(jdText, resumeText);
  const jdWordCount = extractWords(jdText).length;
  const resumeWordCount = extractWords(resumeText).length;
  const commonWordCount = commonWords.length;
  
  if (jdWordCount === 0 || resumeWordCount === 0) {
    return {
      iterations: Array(10).fill(0),
      average: 0,
      common_words: [],
      stats: { jd_words: 0, resume_words: 0, common_words: 0 }
    };
  }
  
  // Run 10 iterations with slight variations
  const iterations = [];
  for (let i = 0; i < 10; i++) {
    // Base score: ratio of common words to JD words
    const baseScore = commonWordCount / jdWordCount;
    
    // Weighted by frequency overlap
    const freqScore = commonWords.reduce((sum, item) => {
      const minFreq = Math.min(item.jd_count, item.resume_count);
      return sum + minFreq;
    }, 0) / jdWordCount;
    
    // Coverage score: how much of resume is relevant to JD
    const coverageScore = commonWordCount / resumeWordCount;
    
    // Add slight random variation (±5%) for each iteration
    const variation = 1 + (Math.random() * 0.1 - 0.05);
    
    // Combine scores with different weights per iteration
    const weights = [
      [0.5, 0.3, 0.2], // Iteration 1: favor base match
      [0.4, 0.4, 0.2], // Iteration 2: balanced
      [0.3, 0.5, 0.2], // Iteration 3: favor frequency
      [0.3, 0.3, 0.4], // Iteration 4: favor coverage
      [0.4, 0.3, 0.3], // Iteration 5: balanced
      [0.5, 0.25, 0.25], // Iteration 6: favor base
      [0.35, 0.4, 0.25], // Iteration 7: favor frequency
      [0.3, 0.4, 0.3], // Iteration 8: balanced
      [0.4, 0.35, 0.25], // Iteration 9: mixed
      [0.33, 0.33, 0.34] // Iteration 10: equal weights
    ];
    
    const [w1, w2, w3] = weights[i];
    const rawScore = (baseScore * w1 + freqScore * w2 + coverageScore * w3) * variation;
    
    // Map to 1-10 scale
    const score = 1 + (Math.min(1, rawScore) * 9);
    iterations.push(Number(score.toFixed(2)));
  }
  
  const average = Number((iterations.reduce((a, b) => a + b, 0) / 10).toFixed(2));
  
  return {
    iterations,
    average,
    common_words: commonWords.slice(0, 50), // Top 50 common words
    stats: {
      jd_words: jdWordCount,
      resume_words: resumeWordCount,
      common_words: commonWordCount
    }
  };
}
function runAll(jd, candidate, passThreshold = 8.0) {
  const built = buildWeightsets(jd, candidate);
  const sets = built.sets;
  const labels = built.labels;
  const iterations = sets.map((w) => evaluate(candidate, jd, w));
  // PRP §4.3.2: 10 iterations averaged; round to 1 decimal place
  const final_score = Number((iterations.reduce((a, b) => a + b, 0) / Math.max(1, iterations.length)).toFixed(1));
  let stability;
  if (final_score >= passThreshold && iterations.length) {
    const perturbed = sets.map((w) => evaluate(candidate, jd, perturb(w)));
    const reeval = perturbed.reduce((a, b) => a + b, 0) / perturbed.length;
    const reeval_score = Number(reeval.toFixed(2));
    const delta = Number(Math.abs(final_score - reeval_score).toFixed(2));
    stability = { reeval_score, delta };
  }
  
  // PRP §4.3.2: Word comparison analysis with 10 iterations
  const jdText = jd.full_text || '';
  const candidateText = candidate.full_text || '';
  const wordComparison = wordComparisonScore(jdText, candidateText);
  
  return { iterations, final_score, stability, labels, word_comparison: wordComparison };
}

module.exports = { runAll, evaluate, buildWeightsets, findCommonWords, wordComparisonScore };
