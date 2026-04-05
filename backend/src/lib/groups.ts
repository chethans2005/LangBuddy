const GROUP_NAMES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
  "Turkish",
  "Dutch",
] as const;

export const ALLOWED_GROUPS = new Set<string>(GROUP_NAMES);

export const isAllowedGroup = (groupId: string): boolean => {
  return ALLOWED_GROUPS.has(groupId);
};
