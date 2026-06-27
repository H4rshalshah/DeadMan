'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('Authentication failed. Redirecting...');
      // Map Google OAuth errors to user-friendly messages
      const mappedError = error === 'access_denied' || error === 'google_oauth_failed'
        ? 'google_oauth_failed'
        : error;
      setTimeout(() => router.push('/auth/login?error=' + mappedError), 2000);
      return;
    }

    if (token) {
      localStorage.setItem('pulseops_token', token);
      setStatus('Authentication successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 1000);
    } else {
      setStatus('No authentication data received. Redirecting...');
      setTimeout(() => router.push('/auth/login?error=oauth_failed'), 2000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-pulseops-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Logo size={64} />
          </motion.div>
        </div>
        <div className="flex items-center justify-center gap-3">
          {!status.includes('failed') && !status.includes('No authentication') && (
            <Loader2 size={20} className="text-pulseops-cyan animate-spin" />
          )}
          <p className="text-pulseops-muted">{status}</p>
        </div>
        {(status.includes('failed') || status.includes('No authentication')) && (
          <p className="text-xs text-pulseops-muted/60 mt-6">
            Google sign-in is temporarily unavailable. Please try email login instead.
          </p>
        )}
      </motion.div>
    </div>
  );
}
