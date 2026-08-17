import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const EXTRACTABLE_TYPES = new Set(['pdf', 'docx', 'image']);

/**
 * Detect how to extract text from an uploaded file.
 * @returns {'pdf'|'docx'|'image'|'unsupported'}
 */
export function detectDocumentType(file) {
  if (!file) return 'unsupported';
  const name = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (
    mime.startsWith('image/') ||
    /\.(jpe?g|png)$/i.test(name)
  ) {
    return 'image';
  }
  return 'unsupported';
}

export function isExtractableFile(file) {
  return EXTRACTABLE_TYPES.has(detectDocumentType(file));
}

async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    parts.push(pageText);
  }

  return parts.join('\n').trim();
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || '').trim();
}

async function extractImageText(file, onProgress) {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(message.progress ?? 0);
      }
    },
  });
  return (result.data?.text || '').trim();
}

/**
 * Extract plain text from PDF, DOCX, or image files (browser only).
 * @param {File} file
 * @param {{ onOcrProgress?: (progress: number) => void }} options
 */
export async function extractDocumentText(file, options = {}) {
  const type = detectDocumentType(file);

  if (type === 'unsupported') {
    throw new Error(
      'Auto-extract supports PDF, DOCX, JPG, JPEG, and PNG only. You can still upload and fill the form manually.',
    );
  }

  let text = '';

  if (type === 'pdf') {
    text = await extractPdfText(file);
    // Scanned PDFs often have little/no text layer — optional simple fallback message
    if (!text || text.length < 30) {
      throw new Error(
        'No selectable text found in this PDF (it may be scanned). Try a JPG/PNG photo or enter details manually.',
      );
    }
  } else if (type === 'docx') {
    text = await extractDocxText(file);
  } else if (type === 'image') {
    text = await extractImageText(file, options.onOcrProgress);
  }

  if (!text?.trim()) {
    throw new Error('No text could be extracted from this file.');
  }

  return text.trim();
}
