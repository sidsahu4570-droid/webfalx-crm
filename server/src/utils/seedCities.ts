import { City } from '../models/City';

const DEFAULT_CITIES = [
  'Indore',
  'Bhopal',
  'Ujjain',
  'Dewas',
  'Ratlam',
  'Mandsaur',
  'Neemuch',
  'Gwalior',
  'Jabalpur',
  'Sagar',
  'Other'
];

export const seedDefaultCities = async () => {
  try {
    const count = await City.countDocuments();
    if (count === 0) {
      const docs = DEFAULT_CITIES.map(name => ({ name, isEnabled: true }));
      await City.insertMany(docs);
      console.log(`[Database Seed] Seeded ${docs.length} default cities successfully.`);
    }
  } catch (error) {
    console.error('[Database Seed Error] Failed to seed default cities:', error);
  }
};
