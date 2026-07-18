export const splitDescriptionAndMov = (description = '') => {
  if (!description) return { baseDescription: '', movItems: [] };

  const movHeader = "[MOV CHECKLIST]";
  const parts = description.split(movHeader);

  const baseDescription = parts[0].trim();
  let movItems = [];

  if (parts.length > 1) {
    movItems = parts[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'))
      .map((line) => line.substring(1).trim());
  }

  return { baseDescription, movItems };
};

export const encodeMovIntoDescription = (baseDescription, movItems) => {
  if (!movItems || movItems.length === 0) return baseDescription;

  const movHeader = "[MOV CHECKLIST]";
  const movContent = movItems.map((item) => `- ${item}`).join('\n');

  return `${baseDescription.trim()}\n\n${movHeader}\n${movContent}`;
};
