'use client';

import { ScrapingJob, Lead } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface JobsTableProps {
  jobs: ScrapingJob[];
  leadsMap: Map<string, Lead[]>;
  onDownload: (jobId: string, format: 'csv' | 'excel') => void;
}

export function JobsTable({ jobs, leadsMap, onDownload }: JobsTableProps) {
  const getStatusBadge = (status: ScrapingJob['status']) => {
    const variants: Record<ScrapingJob['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      processing: { variant: 'default', label: 'Processing' },
      completed: { variant: 'outline', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
    };

    return (
      <Badge variant={variants[status].variant} className="flex items-center gap-1 w-fit">
        {status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
        {variants[status].label}
      </Badge>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No scraping jobs yet</p>
        <p className="text-sm mt-2">Start by creating your first scraping job above</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="text-right">Requested</TableHead>
            <TableHead className="text-right">Extracted</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {format(job.createdAt, 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>{getStatusBadge(job.status)}</TableCell>
              <TableCell className="max-w-xs truncate" title={job.url}>
                {job.url}
              </TableCell>
              <TableCell className="text-right">{job.requestedLeads}</TableCell>
              <TableCell className="text-right">{job.extractedLeads}</TableCell>
              <TableCell className="text-right">{job.creditsUsed}</TableCell>
              <TableCell className="text-right">
                {job.status === 'completed' && leadsMap.has(job.id) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onDownload(job.id, 'csv')}>
                        <FileText className="h-4 w-4 mr-2" />
                        CSV Format
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(job.id, 'excel')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel Format
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
