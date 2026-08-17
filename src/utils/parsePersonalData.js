/**
 * Parse raw document text into resume collection form fields.
 * Uses regex and simple section heuristics for Pakistani CVs/forms.
 */

const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const PHONE_REGEX =
  /(?:\+92|92|0)?3[0-9]{2}[\s-]?[0-9]{7}|(?:\+92|92|0)?3[0-9]{9}/g;

const CNIC_REGEX = /\b\d{5}[-\s]?\d{7}[-\s]?\d\b|\b\d{13}\b/;

const LABEL_VALUE = (labels) =>
  new RegExp(
    `(?:${labels.join('|')})\\s*[:\\-]\\s*(.+?)(?:\\n|$)`,
    'im',
  );

function cleanValue(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatCnic(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 13) return cleanValue(raw);
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return digits;
  }
  return cleanValue(raw);
}

function matchLabel(text, labels) {
  const match = text.match(LABEL_VALUE(labels));
  return match ? cleanValue(match[1]) : '';
}

function extractSection(text, startLabels, endLabels) {
  const startPattern = new RegExp(
    `(?:${startLabels.join('|')})\\s*:?\\s*\\n?([\\s\\S]+)$`,
    'i',
  );
  const fullMatch = text.match(startPattern);
  if (!fullMatch) return '';

  let body = fullMatch[1];
  if (endLabels?.length) {
    const endPattern = new RegExp(
      `(?:\\n|^)(?:${endLabels.join('|')})\\s*:?`,
      'i',
    );
    const endMatch = body.match(endPattern);
    if (endMatch?.index != null) {
      body = body.slice(0, endMatch.index);
    }
  }

  return cleanValue(body.replace(/\n{3,}/g, '\n\n'));
}

/**
 * Try to match department enum from document text.
 * @param {string} text
 * @param {Array<{value:string,label:string}>} departmentOptions
 */
function matchDepartment(text, departmentOptions = []) {
  const lower = text.toLowerCase();
  for (const dept of departmentOptions) {
    const label = dept.label?.toLowerCase();
    const value = dept.value?.toLowerCase();
    if (label && lower.includes(label)) return dept.value;
    if (value && new RegExp(`\\b${value.replace(/_/g, '[\\s_]?')}\\b`, 'i').test(text)) {
      return dept.value;
    }
  }
  return '';
}

/**
 * @param {string} rawText
 * @param {{ departmentOptions?: Array<{value:string,label:string}> }} options
 */
export function parsePersonalData(rawText, options = {}) {
  if (!rawText?.trim()) {
    return {};
  }

  const text = rawText.replace(/\r\n/g, '\n');
  const result = {};

  const emailMatch = text.match(EMAIL_REGEX);
  if (emailMatch) result.email = emailMatch[0].toLowerCase();

  const phoneMatches = text.match(PHONE_REGEX);
  if (phoneMatches?.length) {
    result.phone = formatPhone(phoneMatches[0]);
  }

  const cnicMatch = text.match(CNIC_REGEX);
  if (cnicMatch) result.cnic = formatCnic(cnicMatch[0]);

  const name =
    matchLabel(text, [
      'full name',
      'applicant name',
      'donor name',
      'candidate name',
      'name',
    ]) || '';
  if (name && name.length < 80 && !EMAIL_REGEX.test(name)) {
    result.applicant_name = name;
  }

  const address = matchLabel(text, [
    'current address',
    'permanent address',
    'address',
    'residential address',
  ]);
  if (address) result.address = address;

  const city = matchLabel(text, ['city', 'town']);
  if (city) result.city = city;

  const role = matchLabel(text, [
    'role',
    'designation',
    'position',
    'job title',
    'applied for',
  ]);
  if (role) result.role = role;

  const experience = extractSection(text, [
    'work experience',
    'professional experience',
    'experience',
    'employment history',
  ], ['education', 'skills', 'certifications', 'references', 'personal']);
  if (experience) result.experience = experience;

  const education = extractSection(text, [
    'education',
    'academic qualification',
    'qualifications',
    'academic background',
  ], ['experience', 'skills', 'certifications', 'references', 'personal']);
  if (education) result.education = education;

  const department = matchDepartment(text, options.departmentOptions || []);
  if (department) result.department = department;

  // First non-empty line as name fallback (common on CVs)
  if (!result.applicant_name) {
    const firstLine = text
      .split('\n')
      .map((l) => cleanValue(l))
      .find(
        (line) =>
          line.length > 2 &&
          line.length < 60 &&
          !EMAIL_REGEX.test(line) &&
          !PHONE_REGEX.test(line) &&
          !CNIC_REGEX.test(line) &&
          !/^(curriculum vitae|resume|cv)$/i.test(line),
      );
    if (firstLine) result.applicant_name = firstLine;
  }

  return result;
}
