// Auth.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Assume these are correctly located in the '../../api' path
import { signupUser, loginUser } from "../../api"; 

// --- Shadcn / UI Components (adjust import paths as per your project) ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

// --- Icons ---
import { LogIn, UserPlus, Loader2 } from "lucide-react";

// --- Hooks / Contexts ---
import { useAuth } from "../contexts/AuthContext"; 
import { useToast } from "../hooks/use-toast"; 

// --- Validation Library ---
import { z } from "zod";

// ----------------------
// Validation Schemas
// ----------------------
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100),
  role: z.enum(["client", "admin"], { message: "Please select a valid role" }),
});

const signupSchema = z
  .object({
    email: z.string().trim().email({ message: "Invalid email address" }).max(255),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .max(100),
    confirmPassword: z.string(),
    role: z.enum(["client", "admin"], { message: "Please select a valid role" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ----------------------
// Auth Component
// ----------------------
export default function Auth() {
  const navigate = useNavigate();
  // Destructure login, signup, and isAuthenticated from useAuth
  const { isAuthenticated, login, signup } = useAuth(); 
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    role: "client", 
  });
  const [loginErrors, setLoginErrors] = useState({});

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "client", 
  });
  const [signupErrors, setSignupErrors] = useState({});

  // 💡 Keep Redirect if authenticated for initial loads/manual URL access
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // ----------------------
  // Login Submit Handler
  // ----------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErrors({});

    let validatedData;
    try {
      validatedData = loginSchema.parse(loginForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0]] = err.message;
        });
        setLoginErrors(errors);
        return;
      }
    }

    setIsLoading(true);
    const result = await loginUser(
        validatedData.email, 
        validatedData.password, 
        validatedData.role
    ); 
    setIsLoading(false);

    if (result.success) {
      // FIX 1: Call the context login function to update global state immediately
      login(result.data.token, result.data.user); 
      
      toast({
        title: "Login successful! 🚀",
        description: `Welcome back, ${result.data.user.role}!`,
      });
      
      // FIX 2: Explicitly navigate immediately after state update for reliability
      // This is the most direct way to force the redirect.
      navigate("/"); 
    } else {
      toast({
        title: "Login failed",
        description: result.error || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  // ----------------------
  // Signup Submit Handler
  // ----------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupErrors({});

    let validatedData;
    try {
      validatedData = signupSchema.parse(signupForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0]] = err.message;
        });
        setSignupErrors(errors);
        return;
      }
    }

    setIsLoading(true);
    const result = await signupUser(
      validatedData.email,
      validatedData.password,
      validatedData.role 
    );
    setIsLoading(false);

    if (result.success) {
      // FIX 3: Call the context signup function to update global state immediately
      signup(result.data.token, result.data.user);
      
      toast({
        title: "Account created! 🎉",
        description: `Welcome as a ${result.data.user.role}!`,
      });
      
      // FIX 4: Explicitly navigate immediately after state update for reliability
      navigate("/");
    } else {
      toast({
        title: "Signup failed",
        description: result.error || "Could not create account",
        variant: "destructive",
      });
    }
  };

  // ----------------------
  // JSX UI (No changes needed)
  // ----------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ComData Portal
          </CardTitle>
          <CardDescription>
            Access your projects and manage your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ---------------- Login Tab ---------------- */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="demo@comdata.com"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    required
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-destructive">
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    required
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">
                      {loginErrors.password}
                    </p>
                  )}
                </div>
                
                {/* Role Selection for Login */}
                <div className="space-y-2">
                  <Label htmlFor="login-role">Login As</Label>
                  <Select
                    value={loginForm.role}
                    onValueChange={(value) => 
                      setLoginForm({ ...loginForm, role: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {loginErrors.role && (
                    <p className="text-sm text-destructive">
                      {loginErrors.role}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ---------------- Signup Tab ---------------- */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="john@example.com"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                    required
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-destructive">
                      {signupErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive">
                      {signupErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupForm.confirmPassword}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                  {signupErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {signupErrors.confirmPassword}
                    </p>
                  )}
                </div>
                
                {/* Role Selection for Signup */}
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Account Role</Label>
                  <Select
                    value={signupForm.role}
                    onValueChange={(value) => 
                      setSignupForm({ ...signupForm, role: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {signupErrors.role && (
                    <p className="text-sm text-destructive">
                      {signupErrors.role}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}