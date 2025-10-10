export interface ScrapingJob {
  id: string;
  url: string;
  filename: string;
  requestedLeads: number;
  extractedLeads: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  creditsUsed: number;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface Lead {
  id: string;
  jobId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  companyWebsite: string;
  industry: string;
  companySize: string;
}