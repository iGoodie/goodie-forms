let id = 0;

export function generateId() {
  // Maybe generate a universal one instead of a runtime one in the future, 
  // but this is good enough for now
  return id++;
}
