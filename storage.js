/* Keep original keys and exact backups; invalid data is never overwritten. */
window.ExcedereStore = (() => {
  const keys = ['excedereProjectTasks', 'excedereCaptures', 'excedereMilestones', 'excedereProjectNotes'];
  const uid = () => crypto.randomUUID();
  const normalize = (value, key, index) => {
    if (typeof value === 'string') value = { title: value };
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.title !== 'string') throw Error('Unrecognized saved item');
    for (const field of ['type','project','status','priority','dueDate','notes','createdAt','completedAt','deletedAt']) {
      if (value[field] != null && typeof value[field] !== 'string') throw Error('Unrecognized saved field');
    }
    return { ...value, id: String(value.id ?? `${key}-${index}`), type: value.type || (key === keys[2] ? 'Milestone' : key === keys[3] ? 'Note' : 'Task'), project: value.project || 'Excedere Projects', status: value.status || 'active' };
  };
  function read(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw Error('Saved list is not an array');
    const items = parsed.map((v, i) => normalize(v, key, i));
    if (new Set(items.map(x => x.id)).size !== items.length) throw Error('Duplicate saved IDs');
    return items;
  }
  function write(key, items) {
    read(key); // Never replace malformed or unsupported source data.
    const raw = localStorage.getItem(key);
    if (raw !== null && localStorage.getItem(`${key}BackupV1`) === null) localStorage.setItem(`${key}BackupV1`, raw);
    localStorage.setItem(key, JSON.stringify(items));
  }
  function change(key, id, update) {
    const items = read(key), index = items.findIndex(x => x.id === id);
    if (index < 0) throw Error('Item changed in another tab. Please try again.');
    items[index] = { ...items[index], ...update, updatedAt: new Date().toISOString() };
    write(key, items);
  }
  function add(key, item) {
    const items = read(key);
    items.push({ ...item, id: uid(), status: 'active', createdAt: new Date().toISOString() });
    write(key, items);
  }
  return { keys, read, write, change, add };
})();
