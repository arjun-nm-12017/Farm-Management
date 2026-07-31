export const FARM_TYPES = [
  {
    id: 'crop',
    name: 'Crop Farming',
    emoji: '🌾',
    description: 'Grains, vegetables, fruits, and row crops',
    modules: { fields: true, livestock: false, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: 'Fields', animals: null, produce: 'Crop', herd: null },
    defaultCategories: {
      inventory: ['Seeds', 'Fertilizers', 'Pesticides', 'Fuel', 'Equipment Parts'],
      income: ['Crop Sales', 'Subsidies', 'Other'],
      expense: ['Seeds', 'Fertilizers', 'Labor', 'Fuel', 'Equipment', 'Utilities'],
    },
  },
  {
    id: 'livestock',
    name: 'Livestock',
    emoji: '🐄',
    description: 'Cattle, goats, sheep, and other animals',
    modules: { fields: true, livestock: true, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: 'Pastures', animals: 'Animals', produce: 'Meat/Livestock', herd: 'Herd' },
    defaultCategories: {
      inventory: ['Feed', 'Medications', 'Vaccines', 'Fuel', 'Bedding'],
      income: ['Animal Sales', 'Meat Sales', 'Breeding Fees', 'Other'],
      expense: ['Feed', 'Veterinary', 'Labor', 'Fuel', 'Equipment', 'Utilities'],
    },
  },
  {
    id: 'dairy',
    name: 'Dairy Farm',
    emoji: '🥛',
    description: 'Milk production, dairy cattle management',
    modules: { fields: true, livestock: true, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: 'Paddocks', animals: 'Cows', produce: 'Milk', herd: 'Herd' },
    defaultCategories: {
      inventory: ['Feed', 'Medications', 'Vaccines', 'Fuel', 'Milking Supplies'],
      income: ['Milk Sales', 'Animal Sales', 'Other'],
      expense: ['Feed', 'Veterinary', 'Labor', 'Fuel', 'Equipment', 'Utilities'],
    },
  },
  {
    id: 'poultry',
    name: 'Poultry',
    emoji: '🐔',
    description: 'Chickens, ducks, turkeys, and egg production',
    modules: { fields: false, livestock: true, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: null, animals: 'Birds', produce: 'Eggs / Poultry', herd: 'Flock' },
    defaultCategories: {
      inventory: ['Feed', 'Medications', 'Vaccines', 'Bedding', 'Packaging'],
      income: ['Egg Sales', 'Poultry Sales', 'Other'],
      expense: ['Feed', 'Veterinary', 'Labor', 'Equipment', 'Utilities'],
    },
  },
  {
    id: 'mixed',
    name: 'Mixed Farm',
    emoji: '🌿',
    description: 'Combination of crops and livestock',
    modules: { fields: true, livestock: true, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: 'Fields', animals: 'Animals', produce: 'Produce', herd: 'Herd / Flock' },
    defaultCategories: {
      inventory: ['Seeds', 'Feed', 'Fertilizers', 'Medications', 'Fuel'],
      income: ['Crop Sales', 'Animal Sales', 'Milk/Eggs', 'Other'],
      expense: ['Seeds', 'Feed', 'Labor', 'Veterinary', 'Fuel', 'Equipment'],
    },
  },
  {
    id: 'orchard',
    name: 'Orchard / Horticulture',
    emoji: '🍎',
    description: 'Fruit trees, vineyards, and specialty crops',
    modules: { fields: true, livestock: false, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: 'Orchards', animals: null, produce: 'Fruit', herd: null },
    defaultCategories: {
      inventory: ['Seedlings', 'Fertilizers', 'Pesticides', 'Fuel', 'Packaging'],
      income: ['Fruit Sales', 'Contracts', 'Other'],
      expense: ['Seedlings', 'Fertilizers', 'Labor', 'Fuel', 'Equipment', 'Utilities'],
    },
  },
  {
    id: 'aquaculture',
    name: 'Aquaculture',
    emoji: '🐟',
    description: 'Fish farming, shrimp, and aquatic products',
    modules: { fields: true, livestock: true, inventory: true, tasks: true, finance: true, equipment: true },
    terminology: { fields: 'Ponds', animals: 'Fish / Stock', produce: 'Seafood', herd: 'Stock' },
    defaultCategories: {
      inventory: ['Feed', 'Medications', 'Water Treatment', 'Fuel', 'Nets'],
      income: ['Fish Sales', 'Other'],
      expense: ['Feed', 'Medications', 'Labor', 'Fuel', 'Equipment', 'Utilities'],
    },
  },
]

export const ROLES = [
  { id: 'owner', name: 'Owner / Manager', description: 'Full access to all features and reports' },
  { id: 'worker', name: 'Farm Worker', description: 'View and update assigned tasks and logs' },
  { id: 'viewer', name: 'Viewer / Advisor', description: 'Read-only access to data and reports' },
]

export const UNITS = {
  area: ['Acres', 'Hectares', 'Square Meters', 'Square Feet'],
  weight: ['kg', 'lbs', 'Tons', 'Metric Tons'],
  volume: ['Liters', 'Gallons', 'Cubic Meters'],
  currency: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'],
}

export const GROWTH_STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready', 'Harvested']

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
export const TASK_STATUSES = ['To Do', 'In Progress', 'Done', 'Cancelled']

export const ANIMAL_SPECIES = {
  livestock: ['Cattle', 'Goat', 'Sheep', 'Pig', 'Horse', 'Donkey', 'Buffalo'],
  dairy: ['Holstein Cow', 'Jersey Cow', 'Guernsey Cow', 'Brown Swiss', 'Ayrshire'],
  poultry: ['Chicken', 'Duck', 'Turkey', 'Goose', 'Quail', 'Guinea Fowl'],
  aquaculture: ['Tilapia', 'Salmon', 'Trout', 'Catfish', 'Shrimp', 'Carp', 'Bass'],
}
