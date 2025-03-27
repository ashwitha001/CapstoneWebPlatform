
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

const Hero: React.FC<HeroProps> = ({
  backgroundImage,
  title,
  subtitle,
  buttonText,
  buttonLink,
}) => {
  return (
    <div className="relative h-screen max-h-[1080px] min-h-[480px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      <div className="banner-overlay" />
      <div className="relative h-full flex items-center justify-center">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8">
            {subtitle}
          </p>
          <div>
            <Link
              to={buttonLink}
              className="inline-flex items-center gap-2 bg-nature-500 hover:bg-nature-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:gap-3 shadow-lg hover:shadow-xl"
            >
              {buttonText} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
