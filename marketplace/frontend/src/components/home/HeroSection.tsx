'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';

export function HeroSection() {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Pakistan&apos;s Premier
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
              {' '}Gaming Marketplace
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Buy and sell digital gaming assets securely. From game accounts to rare items, 
            trade with confidence using our escrow-protected platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated && user ? (
              <>
                <Link href="#games">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Browse Games
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    My Account
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#games">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    Browse Games
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Escrow</h3>
              <p className="text-gray-600 text-sm">
                Your payments are protected until you receive your items
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">
                Get your digital items delivered instantly or within hours
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted Community</h3>
              <p className="text-gray-600 text-sm">
                Trade with verified sellers and build your reputation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}