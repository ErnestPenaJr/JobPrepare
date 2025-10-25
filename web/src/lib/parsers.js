let pdfParse = null;
try { pdfParse = (0, eval)('require')('pdf-parse'); } catch (_) { pdfParse = null; }
let pdfjsLib = null;
try { pdfjsLib = (0, eval)('require')('pdfjs-dist/legacy/build/pdf.js'); } catch (_) { pdfjsLib = null; }
const zlib = require('zlib');

function readUInt32LE(buf, off){ return buf.readUInt32LE(off); }
function readUInt16LE(buf, off){ return buf.readUInt16LE(off); }

function unzipDocxText(buffer){
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  // Signatures
  const EOCD_SIG = 0x06054b50; // End of central directory
  const CEN_SIG  = 0x02014b50; // Central directory file header
  const LOC_SIG  = 0x04034b50; // Local file header

  // Find EOCD by scanning backwards up to 64KB
  const maxBack = Math.min(buf.length, 0xFFFF + 22);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= buf.length - maxBack; i--) {
    if (i < 0) break;
    if (readUInt32LE(buf, i) === EOCD_SIG) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) return '';
  const cenSize = readUInt32LE(buf, eocdOffset + 12);
  const cenOff  = readUInt32LE(buf, eocdOffset + 16);

  // Walk central directory to find word/document.xml
  let p = cenOff;
  let target = null;
  while (p + 46 <= buf.length && readUInt32LE(buf, p) === CEN_SIG) {
    const compMethod = readUInt16LE(buf, p + 10);
    const compSize   = readUInt32LE(buf, p + 20);
    const uncompSize = readUInt32LE(buf, p + 24);
    const nameLen    = readUInt16LE(buf, p + 28);
    const extraLen   = readUInt16LE(buf, p + 30);
    const commLen    = readUInt16LE(buf, p + 32);
    const relOff     = readUInt32LE(buf, p + 42);
    const nameStart  = p + 46;
    const nameEnd    = nameStart + nameLen;
    const name = buf.slice(nameStart, nameEnd).toString('utf8');
    if (name === 'word/document.xml') {
      target = { relOff, compMethod, compSize };
      break;
    }
    p = nameEnd + extraLen + commLen;
  }
  if (!target) return '';

  // Local header to find data start
  const lh = target.relOff;
  if (readUInt32LE(buf, lh) !== LOC_SIG) return '';
  const nameLen = readUInt16LE(buf, lh + 26);
  const extraLen = readUInt16LE(buf, lh + 28);
  const dataStart = lh + 30 + nameLen + extraLen;
  const dataEnd = dataStart + target.compSize;
  if (dataEnd > buf.length) return '';
  const compData = buf.slice(dataStart, dataEnd);

  let xml;
  if (target.compMethod === 0) {
    xml = compData.toString('utf8');
  } else if (target.compMethod === 8) {
    try { xml = zlib.inflateRawSync(compData).toString('utf8'); }
    catch { return ''; }
  } else {
    return '';
  }
  return stripXml(xml);
}

async function extractPdfTextWithPdfJs(buffer){
  if (!pdfjsLib) return '';
  try{
    const bytes = Buffer.isBuffer(buffer) ? new Uint8Array(buffer) : new Uint8Array(Buffer.from(buffer));
    const loadingTask = pdfjsLib.getDocument({ data: bytes, disableWorker: true, isEvalSupported: false, useWorkerFetch: false });
    const pdf = await loadingTask.promise;
    const parts = [];
    const pageCount = Math.min(pdf.numPages || 0, 50);
    for (let i = 1; i <= pageCount; i++){
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const text = (tc.items || []).map((it)=> (it.str || '')).join(' ');
      parts.push(text);
    }
    return parts.join('\n').replace(/\s+/g,' ').trim();
  }catch(_){
    return '';
  }
}

function looksLike(filename, ext){ return (filename||'').toLowerCase().endsWith(ext); }

async function parseBufferToText(buffer, mimeType, filename){
  const mt = (mimeType||'').toLowerCase();
  if (mt.includes('pdf') || looksLike(filename, '.pdf')) {
    if (pdfParse) {
      try {
        const data = await pdfParse(buffer);
        return (data.text || '').trim();
      } catch (_) {}
    }
    return await extractPdfTextWithPdfJs(buffer);
  }
  if (mt.includes('word') || mt.includes('docx') || looksLike(filename, '.docx')) {
    // Prefer mammoth when available for better .docx handling
    try {
      const mammoth = (0, eval)('require')('mammoth');
      const res = await mammoth.extractRawText({ buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer) });
      const txt = String(res?.value || '').replace(/\s+/g,' ').trim();
      if (txt) return txt;
    } catch (_) {}
    return unzipDocxText(buffer);
  }
  if (mt.includes('msword') || looksLike(filename, '.doc')) {
    try {
      const WordExtractor = (0, eval)('require')('word-extractor');
      const extractor = new WordExtractor();
      const doc = await extractor.extract(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
      const txt = String(doc.getBody() || '').replace(/\s+/g,' ').trim();
      if (txt) return txt;
    } catch (_) {}
  }
  return Buffer.isBuffer(buffer) ? buffer.toString('utf8') : Buffer.from(buffer).toString('utf8');
}

function stripHtml(html){
  return String(html||'')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { parseBufferToText, stripHtml };
