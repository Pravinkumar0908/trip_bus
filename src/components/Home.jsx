import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import SearchForm from './SearchForm';
import OfferSection from './OffersSection';
import About from './About';
import FAQ from './FAQ';
import Footer from './Footer';




const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* Navbar */}
      <Navbar />

      {/* Hero Section - Hidden on tablet/mobile, visible on laptop+ */}
      <div className="hidden lg:block">
        <HeroSection />
      </div>

      {/* Search Form - Top positioned on mobile/tablet with proper spacing */}
      <div className="pt-20 sm:pt-6 lg:relative lg:-mt-40 lg:pt-0">
        <SearchForm />
      </div>

      {/* Offer Section */}
      <OfferSection />

      <About/>
      <FAQ/>
      <Footer/>

    </div>
  );
};

export default Home;
