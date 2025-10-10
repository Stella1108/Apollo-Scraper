// import { ScrapingJob, Lead } from '../lib/types';


// const companies = [
//   'TechCorp', 'Innovate Labs', 'Digital Ventures', 'CloudScale Inc', 'DataDrive',
//   'NextGen Solutions', 'Quantum Systems', 'Alpha Technologies', 'Beta Dynamics', 'Gamma Corp'
// ];

// const titles = [
//   'CEO', 'CTO', 'VP of Sales', 'Marketing Director', 'Head of Product',
//   'Software Engineer', 'Sales Manager', 'Business Development', 'Product Manager', 'Data Analyst'
// ];

// const industries = [
//   'Technology', 'Healthcare', 'Finance', 'E-commerce', 'SaaS',
//   'Manufacturing', 'Consulting', 'Education', 'Media', 'Retail'
// ];

// const locations = [
//   'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA',
//   'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Miami, FL', 'Portland, OR'
// ];

// const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// function generateRandomLead(jobId: string): Lead {
//   const firstName = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'][Math.floor(Math.random() * 10)];
//   const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(Math.random() * 10)];
//   const name = `${firstName} ${lastName}`;
//   const company = companies[Math.floor(Math.random() * companies.length)];
//   const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';

//   return {
//     id: crypto.randomUUID(),
//     jobId,
//     name,
//     title: titles[Math.floor(Math.random() * titles.length)],
//     company,
//     email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
//     phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
//     location: locations[Math.floor(Math.random() * locations.length)],
//     linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
//     companyWebsite: `https://${domain}`,
//     industry: industries[Math.floor(Math.random() * industries.length)],
//     companySize: companySizes[Math.floor(Math.random() * companySizes.length)]
//   };
// }

// export async function simulateScraping(
//   url: string,
//   numberOfLeads: number,
//   filename: string,
//   onProgress: (job: ScrapingJob, leads: Lead[]) => void
// ): Promise<void> {
//   const jobId = crypto.randomUUID();
//   const leads: Lead[] = [];

//   const job: ScrapingJob = {
//     id: jobId,
//     url,
//     filename,
//     requestedLeads: numberOfLeads,
//     extractedLeads: 0,
//     status: 'processing',
//     creditsUsed: 0,
//     createdAt: new Date()
//   };

//   onProgress(job, leads);

//   const batchSize = 5;
//   const batches = Math.ceil(numberOfLeads / batchSize);

//   for (let i = 0; i < batches; i++) {
//     await new Promise(resolve => setTimeout(resolve, 1500));

//     const leadsInThisBatch = Math.min(batchSize, numberOfLeads - leads.length);

//     for (let j = 0; j < leadsInThisBatch; j++) {
//       leads.push(generateRandomLead(jobId));
//     }

//     job.extractedLeads = leads.length;
//     job.creditsUsed = leads.length;

//     onProgress(job, leads);
//   }

//   job.status = 'completed';
//   job.completedAt = new Date();
//   onProgress(job, leads);
// }

// export function exportToCSV(leads: Lead[]): string {
//   const headers = ['Name', 'Title', 'Company', 'Email', 'Phone', 'Location', 'LinkedIn URL', 'Company Website', 'Industry', 'Company Size'];
//   const rows = leads.map(lead => [
//     lead.name,
//     lead.title,
//     lead.company,
//     lead.email,
//     lead.phone,
//     lead.location,
//     lead.linkedinUrl,
//     lead.companyWebsite,
//     lead.industry,
//     lead.companySize
//   ]);

//   const csvContent = [
//     headers.join(','),
//     ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
//   ].join('\n');

//   return csvContent;
// }

// export function downloadFile(content: string, filename: string, type: 'csv' | 'excel') {
//   const blob = new Blob([content], { type: type === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = `${filename}.${type === 'csv' ? 'csv' : 'xlsx'}`;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
//   URL.revokeObjectURL(url);
// }
