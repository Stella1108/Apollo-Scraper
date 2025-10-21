"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Construction, Sparkles, Zap } from 'lucide-react';

interface ComingSoonTabProps {
  title: string;
  description: string;
}

export function ComingSoonTab({ title, description }: ComingSoonTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 ease-out">
      {/* Header Section */}
      <div className="text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-lg blur opacity-25 animate-pulse"></div>
            {/* <Zap className="w-12 h-12 text-[#8b39ea] relative z-10" /> */}
          </div>
          <div>
            <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent animate-gradient-x select-none">
              {title}
            </h2>
            <p className="text-lg font-medium bg-gradient-to-r from-[#137fc8] via-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent mb-4">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Coming Soon Card */}
      <Card className="shadow-2xl border border-[#8b39ea]/20 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
        <CardContent className="flex flex-col items-center justify-center py-18 px-8 bg-gradient-to-br from-white via-[#8b39ea]/5 to-[#137fc8]/5 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] animate-progress"></div>
          
          {/* Floating Sparkles */}
          <div className="absolute top-4 left-10 animate-float-slow">
            <Sparkles className="w-6 h-6 text-[#8b39ea]/40" />
          </div>
          <div className="absolute bottom-10 right-12 animate-float-medium">
            <Sparkles className="w-4 h-4 text-[#137fc8]/40" />
          </div>
          <div className="absolute top-12 right-16 animate-float-fast">
            <Sparkles className="w-5 h-5 text-[#1d4ed8]/40" />
          </div>

          {/* Main Icon */}
          <div className="relative mb-8">
            <div className="absolute -inset-4   "></div>
            <div className="relative p-8 ">
          
            </div>
          </div>

          {/* Text Content */}
          <h3 className="text-4xl font-bold bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent mb-6 tracking-tight animate-gradient-x">
            Coming Soon
          </h3>
          
          <p className="text-slate-700 text-center max-w-md leading-relaxed text-lg font-medium mb-8">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>

          {/* Animated Progress Dots */}
          <div className="flex space-x-3">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="w-4 h-4 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-full animate-bounce"
                style={{ animationDelay: `${dot * 0.2}s` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="shadow-lg border border-[#137fc8]/20 bg-gradient-to-r from-[#8b39ea]/5 via-[#137fc8]/5 to-[#1d4ed8]/5">
        <CardContent className="py-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-lg shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-lg">Feature in Development</h4>
                <p className="text-slate-600 text-sm">We're building something amazing for you</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] text-white rounded-full text-sm font-medium shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                <Sparkles className="w-4 h-4 mr-2" />
                Notify Me
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }

        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(90deg); }
        }
        .animate-float-fast {
          animation: float-fast 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}