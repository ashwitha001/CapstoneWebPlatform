
import React, { useEffect } from 'react';
import Layout from '../components/Layout';

const JoinUs: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Handle navigation to specific sections based on hash
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <Layout>
      <div className="pt-24 bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8">Join Our Community</h1>

          {/* Careers Section */}
          <section id="careers" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-serif font-semibold mb-4">Careers</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join our team of dedicated professionals who are passionate about connecting people
              with nature and promoting environmental conservation.
            </p>

            {/* No Open Positions Notice */}
            <div className="bg-gray-50 rounded-xl p-6 max-w-3xl">
              <h3 className="text-xl font-serif font-semibold mb-3">No Open Positions</h3>
              <p className="text-gray-600">
                We don't have any open positions at the moment. Please check back later or sign up for our newsletter to be notified of future opportunities.
              </p>
            </div>
          </section>

          {/* Volunteer Opportunities Section */}
          <section id="volunteer" className="scroll-mt-24">
            <h2 className="text-3xl font-serif font-semibold mb-4">Volunteer Opportunities</h2>
            <p className="text-lg text-gray-600 mb-8">
              Volunteers are the backbone of our organization. We offer various volunteer opportunities
              from trail maintenance to event coordination.
            </p>

            {/* Example Volunteer Position */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 max-w-3xl">
              <h3 className="text-xl font-serif font-semibold mb-3">Trail Maintenance Volunteer</h3>
              <p className="text-gray-600 mb-4">
                Help maintain and improve local hiking trails. Activities include clearing debris, repairing trail markers, and erosion control.
              </p>
              <button 
                disabled
                className="bg-nature-500 text-white px-5 py-2 rounded-lg font-medium opacity-90 cursor-not-allowed"
              >
                Apply (Coming Soon)
              </button>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default JoinUs;
