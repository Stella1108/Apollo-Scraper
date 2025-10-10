'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ScraperFormProps {
  onSubmit: (
    url: string,
    numberOfLeads: number,
    filename: string,
    fileFormat: 'csv' | 'xlsx'
  ) => Promise<void>;
  isProcessing: boolean;
}

export function ScraperForm({ onSubmit, isProcessing }: ScraperFormProps) {
  const [url, setUrl] = useState('');
  const [numberOfLeads, setNumberOfLeads] = useState('20');
  const [filename, setFilename] = useState('');
  const [fileFormat, setFileFormat] = useState<'csv' | 'xlsx'>('csv');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url || !numberOfLeads) {
      toast({ title: 'Error', description: 'URL and Number of Leads are required', variant: 'destructive' });
      return;
    }

    try {
      await onSubmit(url, parseInt(numberOfLeads, 10), filename, fileFormat);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent bg-clip-text">
          Apollo Scraper
        </CardTitle>
        <CardDescription>Enter your Apollo URL, leads count, filename & format.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="url">Apollo URL</Label>
            <Input id="url" type="url" placeholder="https://app.apollo.io/#/people?..." value={url} onChange={e => setUrl(e.target.value)} disabled={isProcessing} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOfLeads">Number of Leads</Label>
              <Input id="numberOfLeads" type="number" min={1} max={50000} value={numberOfLeads} onChange={e => setNumberOfLeads(e.target.value)} disabled={isProcessing} required />
            </div>
            <div>
              <Label htmlFor="filename">File Name (optional)</Label>
              <Input id="filename" type="text" placeholder="apollo_leads" value={filename} onChange={e => setFilename(e.target.value)} disabled={isProcessing} />
            </div>
          </div>
          <div>
            <Label htmlFor="fileFormat">File Format</Label>
            <Select value={fileFormat} onValueChange={(value) => setFileFormat(value as 'csv' | 'xlsx')} disabled={isProcessing}>
              <SelectTrigger id="fileFormat">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isProcessing} size="lg" className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Scraping...
              </>
            ) : (
              'Start Scraping'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
