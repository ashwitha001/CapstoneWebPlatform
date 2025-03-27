
import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import Mission from '../components/Mission';
import GetInvolved from '../components/GetInvolved';
import Layout from '../components/Layout';

const Index: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Hero
        backgroundImage="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1974"
        title="Discover Canadian Trails Together"
        subtitle="Welcome to our community of outdoor enthusiasts. This template is designed for non-profit hiking organizations to easily customize and share their guided experiences."
        buttonText="View Our Hikes"
        buttonLink="/hikes"
      />
      <Mission />
      <GetInvolved />
    </Layout>
  );
};

export default Index;
