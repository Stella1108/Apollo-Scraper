import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // For client-side or use service role on backend securely

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Insert job
export async function insertScrapingJob(job: Omit<any, 'id'>) {
  const { data, error } = await supabase.from('scraper_requests').insert(job).select().single();
  if (error) throw error;
  return data;
}

// Update job
export async function updateScrapingJobStatus(jobId: string, status: string, extracted: number, downloadLink?: string) {
  const { error } = await supabase
    .from('scraper_requests')
    .update({ status, extracted, download_link: downloadLink || null })
    .eq('id', jobId);
  if (error) throw error;
}

// Insert leads
export async function insertLeads(jobId: string, leads: any[]) {
  const dataToInsert = leads.map((lead) => ({
    job_id: jobId,
    name: lead.name,
    title: lead.title,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    location: lead.location,
    linkedin_url: lead.linkedinUrl,
    company_website: lead.companyWebsite,
    industry: lead.industry,
    company_size: lead.companySize,
  }));
  const { error } = await supabase.from('scraper_leads').insert(dataToInsert);
  if (error) throw error;
}
