const userSegment = () => localStorage.getItem('userId') || 'anon';

export const loadProfileSnapshot = (key) => {
  try {
    const raw = localStorage.getItem(`letuscook:${key}:${userSegment()}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveProfileSnapshot = (key, data) => {
  try {
    localStorage.setItem(`letuscook:${key}:${userSegment()}`, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
};
