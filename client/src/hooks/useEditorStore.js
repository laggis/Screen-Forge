import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  // Project meta
  projectId:   null,
  projectName: 'My Loading Screen',
  savedAt:     null,
  isDirty:     false,

  // Canvas
  components: [],
  settings: {
    bg: 'linear-gradient(135deg,#080810,#0d0d1a)',
    acc: '#6c63ff',
    serverName: 'My Server',
    discord: '',
    manualShutdown: false,
  },
  selectedId: null,
  scale: 0.65,
  lsTab: 'comps',
  rsTab: 'props',

  // History
  history: [],
  histIdx: -1,

  // ── Setters ────────────────────────────────────────────────────
  setProject: (id, name) => set({ projectId: id, projectName: name, isDirty: false }),
  setProjectName: name => set({ projectName: name, isDirty: true }),
  setSettings: patch => set(s => ({ settings: { ...s.settings, ...patch }, isDirty: true })),
  setScale: scale => set({ scale }),
  setLsTab: lsTab => set({ lsTab }),
  setRsTab: rsTab => set({ rsTab }),
  setSelectedId: selectedId => set({ selectedId }),
  setSavedAt: savedAt => set({ savedAt, isDirty: false }),

  // ── Load project data ─────────────────────────────────────────
  loadData: ({ components, settings, name }) => {
    const comps = Array.isArray(components) ? components : [];
    const setts = settings || {};
    set({
      components: comps,
      settings: setts,
      projectName: name || 'My Loading Screen',
      selectedId: null,
      history: [JSON.parse(JSON.stringify(comps))],
      histIdx: 0,
      isDirty: false,
    });
  },

  // ── History ───────────────────────────────────────────────────
  pushHistory: () => {
    const { components, history, histIdx } = get();
    const snap = JSON.parse(JSON.stringify(components));
    const newHist = [...history.slice(0, histIdx + 1), snap].slice(-60);
    set({ history: newHist, histIdx: newHist.length - 1, isDirty: true });
  },

  undo: () => {
    const { histIdx, history } = get();
    if (histIdx > 0) {
      const idx = histIdx - 1;
      set({ histIdx: idx, components: JSON.parse(JSON.stringify(history[idx])), selectedId: null });
    }
  },

  redo: () => {
    const { histIdx, history } = get();
    if (histIdx < history.length - 1) {
      const idx = histIdx + 1;
      set({ histIdx: idx, components: JSON.parse(JSON.stringify(history[idx])), selectedId: null });
    }
  },

  // ── Components ────────────────────────────────────────────────
  addComponent: comp => {
    set(s => ({ components: [...s.components, comp], selectedId: comp.id, isDirty: true }));
    get().pushHistory();
  },

  updateComponent: (id, updates) => {
    set(s => ({
      components: s.components.map(c => {
        if (c.id !== id) return c;
        if (updates.props) return { ...c, ...updates, props: { ...c.props, ...updates.props } };
        return { ...c, ...updates };
      }),
      isDirty: true,
    }));
  },

  deleteComponent: id => {
    set(s => ({
      components: s.components.filter(c => c.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      isDirty: true,
    }));
    get().pushHistory();
  },

  duplicateComponent: id => {
    const { components } = get();
    const src = components.find(c => c.id === id);
    if (!src) return;
    const nc = { ...JSON.parse(JSON.stringify(src)), id: `c${Date.now()}_${Math.random().toString(36).slice(2,5)}`, x: src.x + 20, y: src.y + 20, z: components.length + 1 };
    set(s => ({ components: [...s.components, nc], selectedId: nc.id, isDirty: true }));
    get().pushHistory();
  },

  // ── Apply template ────────────────────────────────────────────
  applyTemplate: (comps, settings) => {
    set({ components: comps, settings, selectedId: null, isDirty: true });
    get().pushHistory();
  },
}));
