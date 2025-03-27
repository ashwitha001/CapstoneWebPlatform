
import React from 'react';
import { Mountain, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Mission: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">
            Your Organization's Mission
          </h2>
          <p className="section-description">
            This section is where you can share your organization's mission and values. Tell visitors about your
            commitment to the community and the environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Trail Access */}
          <div className="feature-item">
            <div className="feature-icon bg-nature-100">
              <Mountain className="h-6 w-6 text-nature-700" />
            </div>
            <h3 className="text-2xl font-serif font-semibold mb-3">Trail Access</h3>
            <p className="text-muted-foreground mb-4">
              Share your approach to making trails accessible to all.
            </p>
          </div>

          {/* Guided Hikes */}
          <div className="feature-item">
            <div className="feature-icon bg-mountain-100">
              <Map className="h-6 w-6 text-mountain-700" />
            </div>
            <h3 className="text-2xl font-serif font-semibold mb-3">Guided Hikes</h3>
            <p className="text-muted-foreground mb-4">
              Describe your guided hiking programs and what makes them special.
            </p>
          </div>

          {/* Community */}
          <div className="feature-item">
            <div className="feature-icon bg-purple-100">
              <Users className="h-6 w-6 text-purple-700" />
            </div>
            <h3 className="text-2xl font-serif font-semibold mb-3">Community</h3>
            <p className="text-muted-foreground mb-4">
              Highlight your community initiatives and volunteer opportunities.
            </p>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            to="/about"
            className="btn-secondary"
          >
            Learn More About Our Mission
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Mission;
