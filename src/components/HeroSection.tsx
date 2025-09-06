import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Brain, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/medical-hero.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleJoinHangout = () => {
    if (user) {
      navigate('/collaborate');
    } else {
      navigate('/auth');
    }
  };
  
  return (
    <section className="relative py-12 sm:py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="container relative px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit mx-auto lg:mx-0">
                <Shield className="h-3 w-3 mr-1" />
                <span className="text-xs sm:text-sm">Verified Medical Professionals Only</span>
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight">
                Where Doctors
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
                  Hang Out
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                The coolest spot for verified doctors to chill, share cases, discuss treatments, 
                and collaborate on medical breakthroughs. Enhanced with AI-powered insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" onClick={handleJoinHangout} className="w-full sm:w-auto">
                <Users className="h-5 w-5 mr-2" />
                {user ? 'Go to Hangout' : 'Join the Hangout'}
              </Button>
              <Button variant="professional" size="lg" onClick={() => navigate('/ai-features')} className="w-full sm:w-auto">
                <Brain className="h-5 w-5 mr-2" />
                Explore AI Features
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 lg:pt-8">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Peer Verified</span>
              </div>
            </div>
          </div>

          <div className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl lg:rounded-3xl blur-2xl lg:blur-3xl" />
            <img
              src={heroImage}
              alt="Medical professionals collaborating"
              className="relative rounded-xl lg:rounded-2xl shadow-strong w-full h-48 sm:h-64 lg:h-auto object-cover lg:object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;