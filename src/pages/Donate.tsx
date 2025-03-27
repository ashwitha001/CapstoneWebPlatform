
import React, { useEffect } from 'react';
import Layout from '../components/Layout';

const Donate: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="pt-24 bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Support Our Mission</h1>
          <p className="text-lg text-gray-600 max-w-3xl mb-12">
            Your donations help us maintain trails, train guides, provide scholarships for
            underprivileged hikers, and protect natural landscapes.
          </p>

          {/* Donation Form (Coming Soon) */}
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-serif font-semibold mb-4">Donation Form</h2>
              <p className="text-gray-600 mb-6">
                Donation functionality coming soon. Thank you for your interest in supporting Nature Hikes!
              </p>

              <button 
                disabled
                className="w-full bg-nature-500 text-white px-6 py-3 rounded-lg font-medium opacity-90 cursor-not-allowed"
              >
                Donate Now (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Donate;
