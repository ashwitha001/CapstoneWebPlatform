
import React, { useEffect } from 'react';
import Layout from '../components/Layout';

const About: React.FC = () => {
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
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8">About Our Organization</h1>

          {/* Foundation Section */}
          <section id="foundation" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-serif font-semibold mb-4">Our Story</h2>
            <p className="text-lg text-gray-600 mb-6">
              This is where you can share your organization's history and mission. When did you start?
              What inspired the creation of your hiking group?
            </p>
            <p className="text-lg text-gray-600">
              Share how your organization contributes to the community and promotes environmental
              stewardship through hiking and outdoor activities.
            </p>
          </section>

          {/* Guides Section */}
          <section id="guides" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-serif font-semibold mb-4">Our Guides</h2>
            <p className="text-lg text-gray-600 mb-8">
              Introduce your team of guides here. Share their qualifications, experience, and passion
              for the outdoors. This helps build trust with potential participants.
            </p>

            {/* Example Guide */}
            <div className="bg-gray-50 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start max-w-3xl">
              <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=1974" 
                  alt="Guide portrait" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-semibold mb-2">Sarah Johnson</h3>
                <p className="text-nature-600 font-medium mb-3">Head Trail Guide</p>
                <p className="text-gray-600 mb-3">
                  Sarah has been leading hiking tours for over 10 years and is certified in wilderness first aid. 
                  She specializes in alpine environments and loves sharing her knowledge of local flora and fauna.
                </p>
                <p className="text-gray-600">
                  Education: B.S. in Environmental Science, Certified Wilderness Guide
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="scroll-mt-24">
            <h2 className="text-3xl font-serif font-semibold mb-6">Common Questions</h2>

            <div className="space-y-6 max-w-3xl">
              {/* FAQ Item 1 */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <h3 className="text-xl font-serif font-semibold bg-gray-50 px-6 py-4">
                  What should I bring on a hike?
                </h3>
                <div className="px-6 py-4 text-gray-600">
                  <p>
                    Customize this section with your recommended gear list and preparations for participants.
                  </p>
                </div>
              </div>

              {/* FAQ Item 2 */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <h3 className="text-xl font-serif font-semibold bg-gray-50 px-6 py-4">
                  How do I join a guided hike?
                </h3>
                <div className="px-6 py-4 text-gray-600">
                  <p>
                    Explain your registration process and any requirements for participation.
                  </p>
                </div>
              </div>

              {/* FAQ Item 3 */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <h3 className="text-xl font-serif font-semibold bg-gray-50 px-6 py-4">
                  What fitness level is required for your hikes?
                </h3>
                <div className="px-6 py-4 text-gray-600">
                  <p>
                    Detail the different fitness levels required for various hikes and how participants can determine which is right for them.
                  </p>
                </div>
              </div>

              {/* FAQ Item 4 */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <h3 className="text-xl font-serif font-semibold bg-gray-50 px-6 py-4">
                  Are there age restrictions for guided hikes?
                </h3>
                <div className="px-6 py-4 text-gray-600">
                  <p>
                    Specify any age requirements or restrictions for your guided hiking experiences.
                  </p>
                </div>
              </div>

              {/* FAQ Item 5 */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <h3 className="text-xl font-serif font-semibold bg-gray-50 px-6 py-4">
                  What is your cancellation policy?
                </h3>
                <div className="px-6 py-4 text-gray-600">
                  <p>
                    Describe your cancellation policy, including any refunds or credits offered.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default About;
