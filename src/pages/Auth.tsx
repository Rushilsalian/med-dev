import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { Stethoscope, Mail, Lock, User, AlertCircle, FileText, Building, Upload, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { verifyDoctor, VerificationResult } from '@/services/verificationService';
import { toast } from '@/hooks/use-toast';

const Auth = () => {
  const { user, signIn, signUp, signInWithOAuth, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the intended destination from location state, default to collaborate
  const from = location.state?.from?.pathname || '/collaborate';
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    displayName: '',
    medicalLicense: '',
    npi: '',
    state: '',
    specialty: '',
    institution: '',
    verificationDoc: null as File | null
  });
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);
  
  if (user && !loading) {
    return null; // Prevent flash while redirecting
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // Don't set loading to false here if successful - let useEffect handle redirect
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setError(null);
    setIsLoading(true);
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!signUpData.medicalLicense || !signUpData.specialty || !signUpData.institution || !signUpData.verificationDoc) {
      setError('Please fill in all medical verification fields');
      return;
    }

    if (!verificationResult?.isValid) {
      setError('Please complete automated verification first');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.displayName);
    
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      // Show success message instead of error
      setError('Check your email for the confirmation link!');
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Doc Hangout
            </span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to Doc Hangout</h1>
          <p className="text-muted-foreground mt-2">
            Where doctors hang out and collaborate
          </p>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-center">Access Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleOAuthSignIn('facebook')}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
            
            <Tabs defaultValue="signin" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 text-sm">Medical Verification Required</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="license">Medical License Number</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="license"
                            placeholder="e.g., MD123456"
                            className="pl-10"
                            value={signUpData.medicalLicense}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, medicalLicense: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Medical Specialty</Label>
                        <Select onValueChange={(value) => setSignUpData(prev => ({ ...prev, specialty: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cardiology">Cardiology</SelectItem>
                            <SelectItem value="neurology">Neurology</SelectItem>
                            <SelectItem value="radiology">Radiology</SelectItem>
                            <SelectItem value="orthopedics">Orthopedics</SelectItem>
                            <SelectItem value="pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="surgery">Surgery</SelectItem>
                            <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                            <SelectItem value="emergency">Emergency Medicine</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="npi">NPI Number (Optional)</Label>
                          <Input
                            id="npi"
                            placeholder="1234567890"
                            value={signUpData.npi}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, npi: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Select onValueChange={(value) => setSignUpData(prev => ({ ...prev, state: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              <SelectItem value="FL">Florida</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="institution">Medical Institution</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="institution"
                            placeholder="Hospital/Clinic name"
                            className="pl-10"
                            value={signUpData.institution}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, institution: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="verification-doc">Upload Verification Document</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="verification-doc"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setSignUpData(prev => ({ ...prev, verificationDoc: e.target.files?.[0] || null }))}
                            className="hidden"
                          />
                          <label htmlFor="verification-doc">
                            <Button variant="outline" size="sm" asChild>
                              <span className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                {signUpData.verificationDoc ? 'Change File' : 'Upload Document'}
                              </span>
                            </Button>
                          </label>
                          {signUpData.verificationDoc && (
                            <span className="text-xs text-muted-foreground truncate">
                              {signUpData.verificationDoc.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Upload medical license, hospital ID, or other verification document
                        </p>
                      </div>
                      
                      <div className="pt-3">
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full"
                          onClick={async () => {
                            if (!signUpData.medicalLicense || !signUpData.state || !signUpData.verificationDoc) {
                              toast({ title: "Please fill license, state, and upload document first", variant: "destructive" });
                              return;
                            }
                            
                            setIsVerifying(true);
                            try {
                              const result = await verifyDoctor({
                                licenseNumber: signUpData.medicalLicense,
                                npi: signUpData.npi,
                                state: signUpData.state,
                                institution: signUpData.institution,
                                document: signUpData.verificationDoc
                              });
                              
                              setVerificationResult(result);
                              
                              if (result.isValid) {
                                toast({ title: "Verification successful!", description: `Confidence: ${Math.round(result.confidence * 100)}%` });
                              } else {
                                toast({ title: "Verification failed", description: result.errors?.join(', '), variant: "destructive" });
                              }
                            } catch (error) {
                              toast({ title: "Verification error", description: "Please try again", variant: "destructive" });
                            }
                            setIsVerifying(false);
                          }}
                          disabled={isVerifying}
                        >
                          {isVerifying ? 'Verifying...' : 'Verify Credentials'}
                        </Button>
                        
                        {verificationResult && (
                          <div className={`mt-2 p-3 rounded border ${
                            verificationResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {verificationResult.isValid ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`text-sm font-medium ${
                                verificationResult.isValid ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {verificationResult.isValid ? 'Verification Passed' : 'Verification Failed'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(verificationResult.confidence * 100)}% confidence)
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                {verificationResult.details.licenseValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                License
                              </div>
                              <div className="flex items-center gap-1">
                                {verificationResult.details.npiValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                NPI
                              </div>
                              <div className="flex items-center gap-1">
                                {verificationResult.details.documentValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                Document
                              </div>
                              <div className="flex items-center gap-1">
                                {verificationResult.details.institutionValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                Institution
                              </div>
                            </div>
                            
                            {verificationResult.errors && (
                              <div className="mt-2 text-xs text-red-600">
                                {verificationResult.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 text-sm">Account Information</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Display Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Dr. Sarah Johnson"
                            className="pl-10"
                            value={signUpData.displayName}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="doctor@hospital.com"
                            className="pl-10"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            className="pl-10"
                            value={signUpData.password}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-confirm"
                            type="password"
                            placeholder="Confirm your password"
                            className="pl-10"
                            value={signUpData.confirmPassword}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4" variant={error.includes('Check your email') ? 'default' : 'destructive'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center mt-6 space-y-2">
          <p>
            By signing up, you agree to our Terms of Service and Privacy Policy. 
            Doc Hangout complies with HIPAA and medical privacy regulations.
          </p>
          <p className="text-green-600">
            ✅ Automated verification using medical license databases, NPI registry, and document OCR.
            Instant approval for verified credentials.
          </p>
          <p className="text-amber-600">
            ⚠️ OAuth users will need to complete medical verification after first login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;