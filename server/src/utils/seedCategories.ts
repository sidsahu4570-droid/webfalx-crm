import { LeadCategory } from '../models/LeadCategory';

const DEFAULT_CATEGORIES = [
  'Real Estate',
  'Interior Designer',
  'Architect',
  'Doctor',
  'Educational Institute',
  'Restaurant',
  'Hotel',
  'Salon & Spa',
  'Gym & Fitness Center',
  'Retail Shop',
  'E-commerce Business',
  'Manufacturer',
  'Wholesaler',
  'Construction Company',
  'CA / Accountant',
  'Lawyer',
  'Travel Agency',
  'Event Planner',
  'NGO',
  'Hospital',
  'Clinic',
  'Dental Clinic',
  'Automobile Dealer',
  'Electronics Store',
  'Home Decor',
  'Furniture Store',
  'Other'
];

export const seedDefaultCategories = async () => {
  try {
    const count = await LeadCategory.countDocuments();
    if (count === 0) {
      const docs = DEFAULT_CATEGORIES.map(name => ({ name, isEnabled: true }));
      await LeadCategory.insertMany(docs);
      console.log(`[Database Seed] Seeded ${docs.length} default lead categories successfully.`);
    }
  } catch (error) {
    console.error('[Database Seed Error] Failed to seed default categories:', error);
  }
};
