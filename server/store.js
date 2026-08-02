/**
 * Simple JSON file store for JARVIS — tasks, memories, settings.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'jarvis-data.json');

const DEFAULTS = {
  tasks: [],      // {id, text, done, priority, createdAt}
  memories: [],   // {id, text, createdAt}
  settings: { userName: 'Sir', city: 'New York' },
};

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
    }
  } catch (e) {
    console.warn('Store load error:', e.message);
  }
  return structuredClone(DEFAULTS);
}

let state = load();

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.warn('Store save error:', e.message);
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Tasks ── */
export function listTasks() { return state.tasks; }
export function addTask(text, priority = 'normal') {
  const task = { id: uid(), text: String(text).slice(0, 300), done: false, priority, createdAt: new Date().toISOString() };
  state.tasks.push(task); save();
  return task;
}
export function updateTask(id, patch) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return null;
  if (typeof patch.done === 'boolean') t.done = patch.done;
  if (patch.text) t.text = String(patch.text).slice(0, 300);
  if (patch.priority) t.priority = patch.priority;
  save();
  return t;
}
export function deleteTask(id) {
  const before = state.tasks.length;
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  return state.tasks.length < before;
}
export function completeTaskByText(query) {
  const q = String(query).toLowerCase();
  const t = state.tasks.find(t => !t.done && t.text.toLowerCase().includes(q));
  if (t) { t.done = true; save(); }
  return t || null;
}

/* ── Memories ── */
export function listMemories() { return state.memories; }
export function addMemory(text) {
  const m = { id: uid(), text: String(text).slice(0, 500), createdAt: new Date().toISOString() };
  state.memories.push(m);
  if (state.memories.length > 100) state.memories = state.memories.slice(-100);
  save();
  return m;
}
export function deleteMemory(id) {
  const before = state.memories.length;
  state.memories = state.memories.filter(m => m.id !== id);
  save();
  return state.memories.length < before;
}
export function searchMemories(query) {
  const q = String(query).toLowerCase();
  return state.memories.filter(m => m.text.toLowerCase().includes(q));
}

/* ── Settings ── */
export function getSettings() { return state.settings; }
export function updateSettings(patch) {
  if (patch.userName) state.settings.userName = String(patch.userName).slice(0, 50);
  if (patch.city) state.settings.city = String(patch.city).slice(0, 80);
  save();
  return state.settings;
}
