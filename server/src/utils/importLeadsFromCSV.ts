import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Lead, LeadStatus, LeadPriority } from '../models/Lead';
import { LeadCategory } from '../models/LeadCategory';
import { City } from '../models/City';
import { User } from '../models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm_db';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
}

const run = async () => {
  try {
    console.log('[Importer] Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Importer] Connected successfully!');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../Leads.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('[Importer] Leads.csv not found at:', csvPath);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      console.log('[Importer] CSV file is empty.');
      process.exit(0);
    }

    const headers = parseCSVLine(lines[0]);
    console.log('[Importer] Found headers:', headers);

    // Get an admin user to use as default creator for notes if needed
    const defaultAdmin = await User.findOne({ role: 'admin' });
    if (!defaultAdmin) {
      console.error('[Importer] No admin user found in database to associate note creation logs.');
      process.exit(1);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const failedLeadsReport: Array<{ name: string; phone: string; reason: string }> = [];

    // Cache categories, users, cities to avoid hitting database repeatedly in loop
    const categoryCache = new Map<string, any>();
    const userCache = new Map<string, any>();
    const cityCache = new Map<string, any>();

    // Counter for serial numbers
    const maxLead = await Lead.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
    let serialCounter = maxLead && maxLead.serialNumber ? maxLead.serialNumber + 1 : 1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);
      if (fields.length < headers.length) {
        // Skip malformed lines
        continue;
      }

      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = fields[idx];
      });

      const phone = row.phone ? row.phone.trim() : '';
      const name = row.name ? row.name.trim() : '';
      const company = row.company ? row.company.trim() : '';

      if (!name) {
        skipCount++;
        continue;
      }

      // Check duplicate
      let exists = false;
      if (phone) {
        const dupPhone = await Lead.findOne({ phone });
        if (dupPhone) exists = true;
      } else if (name && company) {
        const dupNameCompany = await Lead.findOne({ name, company });
        if (dupNameCompany) exists = true;
      }

      if (exists) {
        skipCount++;
        continue;
      }

      // 1. Resolve Category
      const catName = row.category_name || 'General';
      let categoryId = null;
      let categoryName = catName;
      if (categoryCache.has(catName.toLowerCase())) {
        const cat = categoryCache.get(catName.toLowerCase());
        categoryId = cat._id;
      } else {
        let cat = await LeadCategory.findOne({ name: new RegExp(`^${catName}$`, 'i') });
        if (!cat) {
          cat = await LeadCategory.create({ name: catName });
          console.log(`[Importer] Created new category: ${catName}`);
        }
        categoryCache.set(catName.toLowerCase(), cat);
        categoryId = cat._id;
      }

      // 2. Resolve Caller (User) - Strict match, no auto-creation
      const callerEmail = (row.caller_email || '').trim();
      const callerName = (row.caller_name || '').trim();
      let matchedUser = null;

      if (callerEmail) {
        if (userCache.has(`email:${callerEmail.toLowerCase()}`)) {
          matchedUser = userCache.get(`email:${callerEmail.toLowerCase()}`);
        } else {
          matchedUser = await User.findOne({ email: new RegExp(`^${callerEmail}$`, 'i') });
          if (matchedUser) {
            userCache.set(`email:${callerEmail.toLowerCase()}`, matchedUser);
          }
        }
      }

      if (!matchedUser && callerName) {
        if (userCache.has(`name:${callerName.toLowerCase()}`)) {
          matchedUser = userCache.get(`name:${callerName.toLowerCase()}`);
        } else {
          matchedUser = await User.findOne({ name: new RegExp(`^${callerName}$`, 'i') });
          if (matchedUser) {
            userCache.set(`name:${callerName.toLowerCase()}`, matchedUser);
          }
        }
      }

      if (!matchedUser) {
        errorCount++;
        failedLeadsReport.push({
          name: name || 'Unnamed',
          phone: phone || 'N/A',
          reason: `No matching caller found for email "${callerEmail}" or name "${callerName}".`
        });
        continue;
      }

      const userId = matchedUser._id;
      const finalCallerName = matchedUser.name;
      const finalCallerEmail = matchedUser.email;

      // 3. Resolve City (Read from City column or extract from import details)
      let cityNameInput = row.city || row.city_name || row.cityName || row.City || '';
      
      // Fallback: If no explicit city field, extract from latest_update (e.g. "Imported from Hubli CRM 3.csv")
      if (!cityNameInput && row.latest_update && typeof row.latest_update === 'string') {
        const fileMatch = row.latest_update.match(/Imported from\s+([A-Za-z]+)\s+CRM/i);
        if (fileMatch && fileMatch[1]) {
          cityNameInput = fileMatch[1];
        }
      }
      
      if (!cityNameInput) {
        cityNameInput = 'Hubli'; // fallback default if nothing else is found
      }

      const cleanCityName = cityNameInput.trim();
      let cityId = null;
      let cityName = cleanCityName;

      if (cityCache.has(cleanCityName.toLowerCase())) {
        const city = cityCache.get(cleanCityName.toLowerCase());
        cityId = city._id;
      } else {
        let city = await City.findOne({ name: new RegExp(`^${cleanCityName}$`, 'i') });
        if (!city) {
          city = await City.create({ name: cleanCityName });
          console.log(`[Importer] Created new City: ${cleanCityName}`);
        }
        cityCache.set(cleanCityName.toLowerCase(), city);
        cityId = city._id;
      }

      // 4. Normalize Status
      let status: LeadStatus = 'New';
      const rawStatus = (row.status || '').toLowerCase();
      if (rawStatus === 'new') status = 'New';
      else if (rawStatus === 'interested') status = 'Interested';
      else if (rawStatus === 'follow-up' || rawStatus === 'followup') status = 'Follow-up';
      else if (rawStatus === 'meeting_scheduled' || rawStatus === 'meeting scheduled') status = 'Meeting Scheduled';
      else if (rawStatus === 'converted') status = 'Converted';
      else if (rawStatus === 'not_interested' || rawStatus === 'not interested') status = 'Not Interested';
      else if (rawStatus === 'closed') status = 'Closed';
      else if (rawStatus === 'not_picked' || rawStatus === 'not picked') status = 'Not Picked';

      // 5. Normalize Priority
      let priority: LeadPriority = 'Medium';
      const rawPriority = (row.priority || '').toLowerCase();
      if (rawPriority === 'low') priority = 'Low';
      else if (rawPriority === 'high') priority = 'High';

      // 6. Parse Notes
      const notesList: any[] = [];
      try {
        if (row.notes) {
          const parsedNotes = JSON.parse(row.notes);
          if (Array.isArray(parsedNotes)) {
            parsedNotes.forEach(n => {
              notesList.push({
                content: n.content || n,
                createdBy: userId || defaultAdmin._id,
                createdByName: finalCallerName || 'System',
                createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
              });
            });
          }
        }
      } catch (e) {
        // Ignore note parsing error, insert as single note if plain text
        if (typeof row.notes === 'string' && row.notes.trim()) {
          notesList.push({
            content: row.notes.trim(),
            createdBy: userId || defaultAdmin._id,
            createdByName: finalCallerName || 'System',
            createdAt: new Date()
          });
        }
      }

      const nextFollowUpDate = row.next_follow_up_date && !isNaN(Date.parse(row.next_follow_up_date))
        ? new Date(row.next_follow_up_date)
        : undefined;

      const lastContactDate = row.last_contact_date && !isNaN(Date.parse(row.last_contact_date))
        ? new Date(row.last_contact_date)
        : undefined;

      const createdAt = row.created_date && !isNaN(Date.parse(row.created_date)) ? new Date(row.created_date) : new Date();
      const updatedAt = row.updated_date && !isNaN(Date.parse(row.updated_date)) ? new Date(row.updated_date) : new Date();

      // 7. Create Lead (Direct write to preserve original Created Date and Updated Date timestamps)
      try {
        await Lead.collection.insertOne({
          serialNumber: serialCounter++,
          userId,
          callerName: finalCallerName,
          callerEmail: finalCallerEmail,
          leadType: row.lead_type || 'imported',
          isNewLead: row.is_new_lead === 'true',
          name,
          company,
          email: row.email || '',
          phone,
          address: row.address || '',
          source: row.source || 'CSV Import',
          status,
          priority,
          categoryId,
          categoryName,
          cityId,
          cityName,
          notes: notesList,
          latestUpdate: row.latest_update || 'Lead imported',
          completedFollowUps: parseInt(row.completed_follow_ups, 10) || 0,
          nextFollowUpDate,
          lastContactDate,
          createdAt,
          updatedAt
        });
        successCount++;
      } catch (err) {
        console.error(`[Importer] Error creating lead: ${name}`, err);
        errorCount++;
        failedLeadsReport.push({
          name: name || 'Unnamed',
          phone: phone || 'N/A',
          reason: `Database error: ${(err as any).message}`
        });
      }
    }

    // Print Import Summary
    console.log('\n==================================================');
    console.log('              CSV IMPORT SUMMARY                 ');
    console.log('==================================================');
    console.log(`Total Rows Parsed:     ${lines.length - 1}`);
    console.log(`Successfully Imported: ${successCount}`);
    console.log(`Skipped (Duplicates):  ${skipCount}`);
    console.log(`Failed (No Match/Err): ${errorCount}`);
    console.log('==================================================');
    
    if (failedLeadsReport.length > 0) {
      console.log('\n❌ FAILED RECORDS REPORT:');
      failedLeadsReport.forEach((f, idx) => {
        console.log(`  ${idx + 1}. Lead: "${f.name}" | Phone: "${f.phone}" | Reason: ${f.reason}`);
      });
      console.log('==================================================\n');
    }

  } catch (err) {
    console.error('[Importer Error]', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Importer] Disconnected from database.');
  }
};

run();
