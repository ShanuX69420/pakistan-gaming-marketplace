'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { GamesGrid } from '@/components/games/GamesGrid';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Scroll to games section
    const gamesSection = document.getElementById('games');
    if (gamesSection) {
      gamesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={handleSearch} />
      
      <main>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Games Section */}
        <section id="games" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <GamesGrid searchQuery={searchQuery} />
          </div>
        </section>
        
        {/* Phase Status */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-green-100 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 Phase 18 Complete: Homepage Layout & Games Grid
              </h3>
              <p className="text-green-700">
                The homepage now features a modern layout with responsive design, 
                games grid with search functionality, and mobile-first navigation.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
