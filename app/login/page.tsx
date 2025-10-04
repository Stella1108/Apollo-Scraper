"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader as Loader2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 opacity-80" />
      <motion.div
        initial={{ opacity: 0, y: 64 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-3xl bg-white overflow-hidden relative z-10"
      >
        {/* Left Side: Info/CTA */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-700 flex flex-col justify-center items-center text-white px-10 py-14 relative">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {/* Geometric shapes */}
            <div className="absolute top-12 left-16 w-36 h-36 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-14 right-12 w-28 h-28 bg-white opacity-10 rounded-full blur-2xl"></div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome back!</h2>
          <p className="mb-8 text-lg">Enter your credentials to access your Apollo Scraper account.</p>
          <Link href="/signup">
            <Button variant="outline" className="text-blue-400 border-white hover:bg-white hover:text-blue-700 font-semibold px-8 py-3 transition-all duration-200 rounded-full">
              SIGN UP
            </Button>
          </Link>
        </div>
        {/* Right Side: Login */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full shadow-lg">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-700">Apollo Scraper</span>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-700">
                Sign in to Apollo Scraper
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="font-medium text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="font-medium text-slate-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-md hover:shadow-lg mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
      {/* Animating gradient (CSS) */}
      <style jsx global>{`
        .animate-gradient {
          animation: gradient-move 7s linear infinite;
        }
        @keyframes gradient-move {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
