// scrapeWorker.ts

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { parse } from 'json2csv';
import fs from 'fs/promises';
import path from 'path';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function scrapeLeads(url: string, count: number) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Adjust selectors for Apollo UI
  const leads = await page.evaluate((maxCount) => {
    const elements = [...document.querySelectorAll('.lead-list-item')]; // Update selector accordingly
    return elements.slice(0, maxCount).map(el => ({
      name: el.querySelector('.name')?.textContent?.trim() || '',
      email: el.querySelector('.email')?.textContent?.trim() || '',
      phone: el.querySelector('.phone')?.textContent?.trim() || '',
    }));
  }, count);

  await browser.close();
  return leads;
}

async function processPendingRequests() {
  const { data: requests, error: fetchError } = await supabase
    .from('scraper_requests')
    .select('*')
    .eq('status', 'pending');

  if (fetchError) {
    console.error('Error fetching pending requests:', fetchError);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log('No pending scraping requests found.');
    return;
  }

  for (const req of requests) {
    console.log(`Processing request id=${req.id} url=${req.url}`);

    try {
      await supabase.from('scraper_requests').update({ status: 'processing' }).eq('id', req.id);

      // Scrape leads
      const leads = await scrapeLeads(req.url, req.leads_count);

      // Save leads in scrape_leads table
      for (const lead of leads) {
        await supabase.from('scrape_leads').insert({ request_id: req.id, lead_data: lead });
      }

      // Generate CSV content
      const csv = parse(leads);
      const filename = req.file_name || `leads_${req.id}.csv`;
      const tmpFilePath = path.join('/tmp', filename);

      await fs.writeFile(tmpFilePath, csv);

      // Upload CSV to Supabase Storage bucket 'scraper-files'
      const { error: uploadError } = await supabase.storage
        .from('scraper-files')
        .upload(filename, await fs.readFile(tmpFilePath), {
          contentType: 'text/csv',
          upsert: true,
        });

      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

      // Get public URL for file
      const { data: publicUrlData } = supabase.storage.from('scraper-files').getPublicUrl(filename);
      const downloadUrl = publicUrlData.publicUrl;

      // Update scraper request with completed status and download link
      await supabase.from('scraper_requests')
        .update({
          status: 'completed',
          extracted: leads.length,
          download_link: downloadUrl,
        })
        .eq('id', req.id);

      // Remove local temporary CSV file
      await fs.unlink(tmpFilePath);

      console.log(`Request ${req.id} processed successfully.`);

    } catch (err: any) {
      console.error(`Failed processing request ${req.id}`, err);
      await supabase.from('scraper_requests').update({ status: 'failed' }).eq('id', req.id);
    }
  }
}

processPendingRequests()
  .then(() => console.log('Scraping processing complete'))
  .catch(err => console.error('Scraping worker error:', err));
