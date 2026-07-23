import Papa from 'papaparse';
import { Lead } from '../types';

export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const exportLeadsToCSV = (leads: Lead[], filename = 'leads_export.csv') => {
  const exportData = leads.map((lead, idx) => ({
    'S. No.': lead.serialNumber || idx + 1,
    'Prospect Name': lead.name,
    'Company': lead.company,
    'Email': lead.email,
    'Phone': lead.phone,
    'Address': lead.address,
    'Source': lead.source,
    'Status': lead.status,
    'Priority': lead.priority,
    'Lead Category': lead.categoryName || '',
    'City / Coverage Area': lead.cityName || '',
    'Caller Name': lead.callerName,
    'Caller Email': lead.callerEmail,
    'Latest Update': lead.latestUpdate,
    'Completed Follow-ups': lead.completedFollowUps,
    'Last Contact Date': lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    'Next Follow-up Date': lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    'Created At': new Date(lead.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportCustomDataToCSV = (data: any[], filename = 'export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
