"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface ComingSoonTabProps {
  title: string;
  description: string;
}

export function ComingSoonTab({ title, description }: ComingSoonTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 ease-out">
      <div>
        <h2
          className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-blue-500 via-pink-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-x"
          style={{ backgroundSize: '200% 200%' }}
        >
          {title}
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">{description}</p>
      </div>

      <Card className="shadow-lg border-slate-300 hover:shadow-xl transition-shadow duration-300">
        <CardContent className="flex flex-col items-center justify-center py-20 px-8">
          <div className="p-6 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full mb-6 shadow-lg animate-pulse">
            <Construction className="w-14 h-14 text-blue-700" />
          </div>
          <h3 className="text-3xl font-semibold text-slate-900 mb-4 tracking-wide">
            Coming Soon
          </h3>
          <p className="text-slate-600 text-center max-w-md leading-relaxed">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
