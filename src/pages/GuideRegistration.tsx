
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const GuideRegistration: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ valid: boolean; email?: string; name?: string }>({ valid: false });
  const { verifyGuideToken, completeGuideRegistration } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      // Verify the token
      const info = verifyGuideToken(token);
      setTokenInfo(info);
      
      if (!info.valid) {
        toast({
          variant: "destructive",
          title: "Invalid Registration Link",
          description: "This registration link is invalid or has expired.",
        });
      }
    }
  }, [token, verifyGuideToken, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "Missing registration token.",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await completeGuideRegistration(token, password);
      
      if (success) {
        navigate('/login');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !tokenInfo.valid) {
    return (
      <Layout>
        <div className="pt-24 min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Invalid Registration Link</CardTitle>
                <CardDescription>
                  This registration link is invalid or has expired. Please contact your administrator for a new invitation.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/')} className="w-full">Return to Home</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-24 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Complete Your Guide Registration</CardTitle>
              <CardDescription>
                Welcome, {tokenInfo.name}! Please create a password to complete your registration.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={tokenInfo.email}
                    disabled
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                    placeholder="Create a secure password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full"
                    placeholder="Confirm your password"
                  />
                </div>
                {password !== confirmPassword && password && confirmPassword && (
                  <p className="text-red-500 text-sm">Passwords do not match</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading || !password || password !== confirmPassword}
                  className="w-full"
                >
                  {isLoading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default GuideRegistration;
