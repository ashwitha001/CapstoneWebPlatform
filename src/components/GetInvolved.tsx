
import React from 'react';
import { Link } from 'react-router-dom';

const GetInvolved: React.FC = () => {
  return (
    <section className="py-24 bg-nature-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">
            Get Involved
          </h2>
          <p className="section-description">
            Customize this section to encourage visitors to join your community or support your cause.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-6">
          <Link
            to="/join-us"
            className="btn-primary text-center"
          >
            Join Us
          </Link>
          <Link
            to="/donate"
            className="btn-secondary text-center"
          >
            Support Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GetInvolved;
