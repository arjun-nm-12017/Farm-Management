import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId, nowISO } from '../utils/helpers'

const useFarmStore = create(
  persist(
    (set, get) => ({
      // ─── Onboarding ─────────────────────────────────────────────────
      onboardingComplete: false,
      farmProfile: null,
      enabledModules: {
        fields: true, livestock: true, inventory: true,
        tasks: true, finance: true, equipment: true, reports: true, weather: true,
      },

      // ─── Auth ────────────────────────────────────────────────────────
      currentUser: null,
      users: [],

      // ─── Fields & Crops ──────────────────────────────────────────────
      fields: [],
      crops: [],
      fieldActivities: [],

      // ─── Livestock ───────────────────────────────────────────────────
      animals: [],
      healthRecords: [],
      productionLogs: [],

      // ─── Inventory ───────────────────────────────────────────────────
      inventoryItems: [],
      stockLogs: [],

      // ─── Tasks ───────────────────────────────────────────────────────
      tasks: [],

      // ─── Finance ─────────────────────────────────────────────────────
      transactions: [],

      // ─── Equipment ───────────────────────────────────────────────────
      equipment: [],
      maintenanceLogs: [],

      // ═══════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════

      // Onboarding
      completeOnboarding: (profile, modules, firstUser) =>
        set({
          onboardingComplete: true,
          farmProfile: profile,
          enabledModules: modules,
          currentUser: firstUser,
          users: [firstUser],
        }),

      updateFarmProfile: (profile) =>
        set((s) => ({ farmProfile: { ...s.farmProfile, ...profile } })),

      updateEnabledModules: (modules) =>
        set((s) => ({ enabledModules: { ...s.enabledModules, ...modules } })),

      // Auth
      login: (userId) =>
        set((s) => ({ currentUser: s.users.find((u) => u.id === userId) || null })),

      addUser: (user) =>
        set((s) => ({ users: [...s.users, { ...user, id: generateId(), createdAt: nowISO() }] })),

      updateUser: (id, data) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)) })),

      removeUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      // Fields
      addField: (field) =>
        set((s) => ({ fields: [...s.fields, { ...field, id: generateId(), createdAt: nowISO() }] })),

      updateField: (id, data) =>
        set((s) => ({ fields: s.fields.map((f) => (f.id === id ? { ...f, ...data, updatedAt: nowISO() } : f)) })),

      removeField: (id) =>
        set((s) => ({ fields: s.fields.filter((f) => f.id !== id) })),

      // Crops
      addCrop: (crop) =>
        set((s) => ({ crops: [...s.crops, { ...crop, id: generateId(), createdAt: nowISO() }] })),

      updateCrop: (id, data) =>
        set((s) => ({ crops: s.crops.map((c) => (c.id === id ? { ...c, ...data, updatedAt: nowISO() } : c)) })),

      removeCrop: (id) =>
        set((s) => ({ crops: s.crops.filter((c) => c.id !== id) })),

      addFieldActivity: (activity) =>
        set((s) => ({
          fieldActivities: [...s.fieldActivities, { ...activity, id: generateId(), createdAt: nowISO() }],
        })),

      // Animals
      addAnimal: (animal) =>
        set((s) => ({ animals: [...s.animals, { ...animal, id: generateId(), createdAt: nowISO() }] })),

      updateAnimal: (id, data) =>
        set((s) => ({ animals: s.animals.map((a) => (a.id === id ? { ...a, ...data, updatedAt: nowISO() } : a)) })),

      removeAnimal: (id) =>
        set((s) => ({ animals: s.animals.filter((a) => a.id !== id) })),

      addHealthRecord: (record) =>
        set((s) => ({ healthRecords: [...s.healthRecords, { ...record, id: generateId(), createdAt: nowISO() }] })),

      addProductionLog: (log) =>
        set((s) => ({ productionLogs: [...s.productionLogs, { ...log, id: generateId(), createdAt: nowISO() }] })),

      // Inventory
      addInventoryItem: (item) =>
        set((s) => ({
          inventoryItems: [...s.inventoryItems, { ...item, id: generateId(), createdAt: nowISO() }],
        })),

      updateInventoryItem: (id, data) =>
        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) => (i.id === id ? { ...i, ...data, updatedAt: nowISO() } : i)),
        })),

      removeInventoryItem: (id) =>
        set((s) => ({ inventoryItems: s.inventoryItems.filter((i) => i.id !== id) })),

      addStockLog: (log) =>
        set((s) => {
          const newLog = { ...log, id: generateId(), createdAt: nowISO() }
          const items = s.inventoryItems.map((item) => {
            if (item.id !== log.itemId) return item
            const delta = log.type === 'in' ? log.quantity : -log.quantity
            return { ...item, quantity: Math.max(0, (item.quantity || 0) + delta), updatedAt: nowISO() }
          })
          return { stockLogs: [...s.stockLogs, newLog], inventoryItems: items }
        }),

      // Tasks
      addTask: (task) =>
        set((s) => ({ tasks: [...s.tasks, { ...task, id: generateId(), status: task.status || 'To Do', createdAt: nowISO() }] })),

      updateTask: (id, data) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data, updatedAt: nowISO() } : t)) })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // Finance
      addTransaction: (txn) =>
        set((s) => ({ transactions: [...s.transactions, { ...txn, id: generateId(), createdAt: nowISO() }] })),

      updateTransaction: (id, data) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data, updatedAt: nowISO() } : t)),
        })),

      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      // Equipment
      addEquipment: (item) =>
        set((s) => ({ equipment: [...s.equipment, { ...item, id: generateId(), createdAt: nowISO() }] })),

      updateEquipment: (id, data) =>
        set((s) => ({
          equipment: s.equipment.map((e) => (e.id === id ? { ...e, ...data, updatedAt: nowISO() } : e)),
        })),

      removeEquipment: (id) =>
        set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) })),

      addMaintenanceLog: (log) =>
        set((s) => ({
          maintenanceLogs: [...s.maintenanceLogs, { ...log, id: generateId(), createdAt: nowISO() }],
        })),

      // Reset
      resetApp: () =>
        set({
          onboardingComplete: false,
          farmProfile: null,
          currentUser: null,
          users: [],
          fields: [],
          crops: [],
          fieldActivities: [],
          animals: [],
          healthRecords: [],
          productionLogs: [],
          inventoryItems: [],
          stockLogs: [],
          tasks: [],
          transactions: [],
          equipment: [],
          maintenanceLogs: [],
        }),
    }),
    {
      name: 'farm-management-v1',
      version: 1,
    }
  )
)

export default useFarmStore
