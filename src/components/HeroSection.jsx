import React from 'react';

const HeroSection = () => {
  return (
    <div
      className="relative bg-cover bg-center h-96"
      style={{
        backgroundImage:
          "url('https://s3.rdbuz.com/Images/responsiveweb/HomeBanner.webp')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-5 flex items-center">
        <div style={{ maxWidth: '500px' }} className=" px-4 text-white">
          <h1 className="text-4xl font-bold mb-2">
            India’s No. 1 Online Bus Ticket Booking Site
          </h1>
          <p className="text-lg">
            Trusted by over 36 million happy customers globally
          </p>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;
