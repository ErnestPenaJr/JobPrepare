// Lightweight synonym expander used by scoring/extraction
function synonymize(term){
  const t = String(term || '').toLowerCase();
  const map = {
    'ms-sql': ['ms-sql','mssql','sql server','t-sql','transact-sql'],
    'power bi': ['power bi','powerbi'],
    'time series': ['time series','time-series','timeseries'],
    'api': ['api','rest','restful','json'],
    'c#': ['c#','c sharp'],
    'r': ['r','r-lang'],
    'sas': ['sas'],
    'eviews': ['eviews'],
    'javascript': ['javascript','js'],
    'typescript': ['typescript','ts'],
    'aws': ['aws','amazon web services'],
    'gcp': ['gcp','google cloud','google cloud platform'],
    'docker': ['docker'],
    'kubernetes': ['kubernetes','k8s'],
    'terraform': ['terraform'],
    'postgres': ['postgres','postgresql'],
    'mysql': ['mysql'],
    'oracle': ['oracle','oracle db'],
    'mongodb': ['mongodb','mongo'],
    'kafka': ['kafka','apache kafka'],
    'rabbitmq': ['rabbitmq'],
    'tableau': ['tableau'],
    'dbt': ['dbt','data build tool'],
    'airflow': ['airflow','apache airflow'],
    'pandas': ['pandas'],
    'numpy': ['numpy'],
    'scikit': ['scikit-learn','sklearn','scikit'],
    'excel': ['excel','microsoft excel'],
    'react': ['react','reactjs','react.js'],
    'vue': ['vue','vuejs','vue.js'],
    'angular': ['angular','angularjs'],
    'node': ['node','nodejs','node.js'],
    'express': ['express','express.js'],
    'java': ['java'],
    'spring': ['spring','spring boot','springboot'],
    '.net': ['.net','dotnet'],
  };
  const base = map[t];
  if (base) return base;
  return [t];
}

module.exports = { synonymize };
