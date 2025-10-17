"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, Orbit, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  // Fix hydration by only rendering after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created successfully! Please log in.');
        router.push('/login');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] rounded-xl">
            <Orbit className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent">
            Globo Polo
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] opacity-80" />
      
      <motion.div
        initial={{ opacity: 0, y: 64 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-3xl bg-white overflow-hidden relative z-10"
      >
        {/* Left Section: Signup */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            {/* Enhanced Globo Polo Icon */}
            <div className="relative group">
              <div className="relative p-2 bg-gradient-to-br from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                <Orbit className="w-8 h-8 text-white transform group-hover:rotate-180 transition-transform duration-500" />
                {/* Animated orbiting dot */}
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full absolute top-0 right-0 group-hover:scale-150 transition-transform duration-300"></div>
                </div>
                {/* Sparkle effects */}
                <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent">
              Globo Polo
            </span>
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#8b39ea] to-[#1d4ed8] bg-clip-text text-transparent">
                Create an account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-medium text-slate-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="mt-2 border-gray-300 focus:border-[#8b39ea] focus:ring-[#8b39ea] transition-colors duration-300"
                    autoComplete="name"
                  />
                </div>
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
                    className="mt-2 border-gray-300 focus:border-[#8b39ea] focus:ring-[#8b39ea] transition-colors duration-300"
                    autoComplete="email"
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
                    minLength={6}
                    className="mt-2 border-gray-300 focus:border-[#8b39ea] focus:ring-[#8b39ea] transition-colors duration-300"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#8b39ea] to-[#137fc8] hover:from-[#7a2dd4] hover:to-[#0f6cb0] text-white font-medium shadow-md hover:shadow-lg mt-2 transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                  disabled={loading}
                >
                  <span className="relative z-10">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7a2dd4] to-[#0f6cb0] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-[#8b39ea] hover:text-[#7a2dd4] font-medium transition-colors duration-300"
                >
                  Log in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Info/CTA */}
        <div className="bg-gradient-to-br from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] flex flex-col justify-center items-center text-white px-10 py-14 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-12 left-16 w-36 h-36 bg-white opacity-10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-14 right-12 w-28 h-28 bg-white opacity-10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white opacity-10 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center relative z-10"
          >
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="relative p-3 bg-white/20 rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110">
                  <Orbit className="w-12 h-12 text-white transform group-hover:rotate-180 transition-transform duration-700" />
                  {/* Animated orbiting dot */}
                  <div className="absolute -top-2 -right-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="w-4 h-4 bg-yellow-400 rounded-full absolute top-0 right-0 group-hover:scale-150 transition-transform duration-300"></div>
                  </div>
                  {/* Sparkle effects */}
                  <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Welcome to Globo Polo!</h2>
            <p className="mb-8 text-lg opacity-90">
              Join thousands of businesses using our all-in-one intelligence platform to drive growth and efficiency.
            </p>
            
            <Link href="/login">
              <Button
                variant="outline"
                className="text-black border-white hover:bg-white hover:text-[#8b39ea] font-semibold px-8 py-3 transition-all duration-300 rounded-full transform hover:scale-105 hover:shadow-lg"
              >
                SIGN IN
              </Button>
            </Link>
          </motion.div>

          {/* Floating features */}

        </div>
      </motion.div>
    </div>
  );
}