"use client"

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { 
  sendSignInLinkToEmail, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button"
import Image from "next/image";
import Link from "next/link";
import {toast} from "sonner";
import FormField from "@/components/FormField";
import {useRouter} from "next/navigation";

/**
 * ZOD VALIDATION SCHEMA
 * This defines exactly what data is allowed inside our form and automatically throws errors if the user breaks a rule.
 * By passing `isPasswordless`, the schema becomes "smart": it ignores name/password checks during Magic Link logins!
 */
const authFormSchema = (type: FormType, isPasswordless: boolean) => {
    return z.object({
        // Name is ONLY required when signing up normally (not passwordless)
        name: type === 'sign-up' && !isPasswordless 
            ? z.string().min(3, "Name must be at least 3 characters") 
            : z.string().optional(),
            
        // Email is ALWAYS required. We use a strict Regex pattern to block fake/spam formats
        email: z.string()
            .min(1, "Email is required")
            .email("Invalid email format")
            .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"),
            
        // Password is completely optional if using Magic Link, otherwise strictly requires 6+ characters.
        password: isPasswordless 
            ? z.string().optional() 
            : z.string().min(6, "Password must be at least 6 characters"),
    });
}

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    
    // State to toggle between Standard Password login and Magic Link login UI
    const [isPasswordless, setIsPasswordless] = useState(false);
    
    // Loading state prevents users from spamming the submit button
    const [isLoading, setIsLoading] = useState(false);
    
    // Dynamically retrieve the validation schema. If toggle changes, schema instantly adapts!
    const formSchema = authFormSchema(type, isPasswordless);

    // Initialize React-Hook-Form and connect it to our Zod schema resolver
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    /**
     * MAIN AUTHENTICATION HANDLER
     * Triggers when the user successfully passes all Zod validation rules and clicks the button.
     */
    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            
            // ==========================================
            // 1. MAGIC LINK (PASSWORDLESS) FLOW
            // ==========================================
            if (isPasswordless) {
                // Setup configuration where Firebase should bounce the user back after clicking the email link
                const actionCodeSettings = {
                  url: window.location.origin + '/finishSignUp', // Redirection UI route you created!
                  handleCodeInApp: true,
                };
                
                // Blast the magic link out via Firebase
                await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
                
                // Store email aggressively in local storage so the device instantly remembers them upon returning
                window.localStorage.setItem('emailForSignIn', values.email);
                
                toast.success('Magic link sent! Check your email to complete sign in.');
                setIsLoading(false);
                return;
            }

            // ==========================================
            // 2. STANDARD PASSWORD FLOW (SIGN-UP)
            // ==========================================
            if(type === 'sign-up') {
                // Create the user in Firebase backend
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password!);
                
                // If they provided a name, map it into their hidden Firebase profile
                // If they provided a name, map it into their hidden Firebase profile
                if (values.name) {
                    await updateProfile(userCredential.user, { displayName: values.name });
                }
                
                // Redirect user to sign-in page smoothly after clicking the link in their email
                const actionCodeSettings = {
                  url: window.location.origin + '/sign-in', 
                  handleCodeInApp: true,
                };
                
                // Send an official verification email link immediately
                await sendEmailVerification(userCredential.user, actionCodeSettings);
                
                // SECURITY ENFORCEMENT: Kick the user completely out immediately! This locks out unverified emails instantly!
                await signOut(auth); 
                
                toast.success('Account created! Please check your Spam or Junk folder to verify before signing.');
                router.push('/sign-in')
                
            // ==========================================
            // 3. STANDARD PASSWORD FLOW (SIGN-IN)  
            // ==========================================
            } else {
                // Check if they are valid
                const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password!);
                
                // Check if they skipped the verification link from their inbox earlier
                if (!userCredential.user.emailVerified) {
                    const actionCodeSettings = {
                       url: window.location.origin + '/sign-in', 
                       handleCodeInApp: true,
                    };

                    toast.error('Email not verified. Please check your spam/junk folder!', {
                        className: 'toast-long',
                        action: {
                            label: 'Resend Email',
                            onClick: async () => {
                                try {
                                    await sendEmailVerification(userCredential.user, actionCodeSettings);
                                    toast.success('Verification email resent! Check your spam folder.');
                                } catch (e:any) {
                                    toast.error('Please wait a moment before resending.');
                                }
                            }
                        },
                        duration: 8000,
                    });
                    
                    await signOut(auth); // SECURITY ENFORCEMENT: Lock them back out! Disable unauthorized dashboard access!
                    setIsLoading(false);
                    return;
                }
                
                toast.success('Signed in successfully.');
                router.push('/')
            }
        } catch (error: any) {
            // console.error(error); // Hidden so Next.js doesn't show a massive red screen overlay in Dev Mode for intentional errors!
            // Fallback message
            let errorMessage = "There was an error: " + (error.message || error);
            
            // Gracefully catch and translate standard ugly Firebase error codes into human readable formats
            if (error.code === 'auth/email-already-in-use') errorMessage = "This email is already registered. Please sign in.";
            if (error.code === 'auth/invalid-credential') errorMessage = "Incorrect email or password.";
            if (error.code === 'auth/too-many-requests') errorMessage = "Too many attempts. Please try again later.";
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false); // Enable the button again regardless of success or failure
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            toast.success('Successfully signed in with Google!');
            router.push('/');
        } catch (error: any) {
            // console.error(error); // Hidden so Next.js doesn't show a massive red screen overlay in Dev Mode for intentional errors!
            toast.error(`Google sign in failed: ${error.message || error}`);
        } finally {
            setIsLoading(false);
        }
    }

    const isSignIn = type === 'sign-in';

    return (
        <div className="glow-wrapper lg:min-w-[566px] max-w-[580px] w-full mx-auto relative group">
            <style>{`
                /* 
                 * ==========================================
                 * AESTHETIC OVERRIDES (CUSTOM UI ENGINE)
                 * ==========================================
                 * We bypass standard Tailwind components here to inject high-end performance animations and custom Glassmorphism.
                 * Includes border rotations, shimmering text logic, and deep iOS/macOS blur filters.
                 */
                @keyframes borderSpin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                
                @keyframes floatAnimation {
                    0%, 100% { transform: translateY(0px); filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.5)); }
                    50% { transform: translateY(-8px); filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.8)); }
                }

                @keyframes shimmerText {
                    to { background-position: -200% center; }
                }
                
                .glow-wrapper {
                   position: relative;
                   border-radius: 1.5rem;
                   background: transparent;
                   padding: 2px;
                   overflow: hidden;
                   box-shadow: 0 0 40px -10px rgba(139, 92, 246, 0.4);
                   transition: box-shadow 0.5s ease, transform 0.4s ease;
                }
                
                .glow-wrapper:hover {
                   box-shadow: 0 0 60px -5px rgba(168, 85, 247, 0.6);
                }

                .glow-wrapper::before {
                   content: '';
                   position: absolute;
                   top: 50%;
                   left: 50%;
                   width: 150%;
                   height: 150%;
                   background: conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(168, 85, 247, 0.8) 80%, rgba(56, 189, 248, 1) 100%);
                   animation: borderSpin 6s linear infinite;
                   z-index: 0;
                }

                .glow-card-inner {
                    position: relative;
                    z-index: 1;
                    background: rgba(14, 15, 23, 0.85);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 1.4rem;
                }

                .animate-glow-float {
                    animation: floatAnimation 4s ease-in-out infinite;
                }

                .text-gradient-shimmer {
                    background: linear-gradient(90deg, #60a5fa 10%, #a855f7 40%, #f472b6 60%, #60a5fa 90%);
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: shimmerText 5s linear infinite;
                }
                
                .fancy-quote {
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 3rem;
                    line-height: 0;
                    margin-top: 0.2em; 
                }

                /* Override Inputs for Glassmorphism */
                .glow-card-inner input {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    transition: all 0.3s ease !important;
                    border-radius: 9999px !important;
                    padding-left: 1.25rem !important;
                    padding-right: 1.25rem !important;
                    min-height: 3rem !important;
                }

                .glow-card-inner input:focus-visible {
                    background: rgba(255, 255, 255, 0.08) !important;
                    border-color: #a855f7 !important;
                    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.25) !important;
                    outline: none !important;
                }

                /* Overriding labels */
                .glow-card-inner label {
                    color: rgba(255, 255, 255, 0.75) !important;
                    font-weight: 500 !important;
                    text-transform: capitalize;
                }
                
                /* Fancy Glow Buttons */
                .btn-vibrant {
                    background: linear-gradient(135deg, #7c3aed, #3b82f6) !important;
                    border: none !important;
                    color: white !important;
                    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.5) !important;
                    transition: all 0.3s ease !important;
                }
                .btn-vibrant:hover {
                    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.8) !important;
                    transform: translateY(-2px);
                }

                .btn-glass-outline {
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    color: white !important;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease !important;
                }
                .btn-glass-outline:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-color: rgba(168, 85, 247, 0.5) !important;
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2) !important;
                    transform: translateY(-1px);
                }
            `}</style>
            
            <div className="flex flex-col gap-6 glow-card-inner py-14 px-8 sm:px-12 min-h-full">
                
                <div className="flex flex-row gap-2 justify-center -mt-8 -mb-10 lg:-mt-12 lg:-mb-12">
                    <Image
                        src="/AIMockMateLogoBig.jpeg"
                        alt="logo"
                        height={120}
                        width={306}
                        className="object-cover object-center animate-glow-float pointer-events-none select-none"
                        draggable={false}
                    />
                </div>

                <div className="flex justify-center w-full mt-6 mb-8">
                    <div className="animate-glow-float flex items-start justify-center space-x-1 w-full overflow-hidden">
                        <span className="fancy-quote text-blue-400 drop-shadow-md">“</span>
                        <h3 className="text-gradient-shimmer italic font-serif text-lg sm:text-xl md:text-[26px] tracking-wide font-extrabold pb-1 px-1 whitespace-nowrap">
                            Practice Job Interview with AI
                        </h3>
                        <span className="fancy-quote text-pink-400 drop-shadow-md">”</span>
                    </div>
                </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5 form">
                        {!isSignIn && !isPasswordless && (
                            <FormField
                                control={form.control}
                                name="name"
                                label="Name"
                                placeholder="Your Name"
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your email address"
                            type="email"
                        />

                        {!isPasswordless && (
                            <FormField
                                control={form.control}
                                name="password"
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                            />
                        )}

                        <div className="flex flex-col gap-6 pt-4">
                            <Button className="!w-full !rounded-full !min-h-[3rem] !font-bold !px-5 cursor-pointer btn-vibrant text-md" type="submit" disabled={isLoading}>
                                {isLoading ? "Processing..." : isPasswordless ? 'Send Magic Link ✨' : (isSignIn ? 'Sign in to Continue' : 'Create Account')}
                            </Button>
                            
                            <div className="relative mt-2 mb-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="px-3 rounded-full" style={{ background: '#121319' }}><span className="text-gray-400 font-medium tracking-wider">Or continue with</span></span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Button 
                                    type="button" 
                                    className="flex-1 w-full flex gap-2 items-center justify-center font-semibold shadow-sm transition-all pointer-events-auto btn-glass-outline rounded-xl min-h-[3rem]"
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                >
                                    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                                    </svg>
                                    Google
                                </Button>

                                <Button 
                                    type="button" 
                                    className="flex-1 w-full flex gap-2 items-center justify-center font-semibold shadow-sm transition-all pointer-events-auto btn-glass-outline rounded-xl min-h-[3rem]"
                                    onClick={() => setIsPasswordless(!isPasswordless)}
                                    disabled={isLoading}
                                >
                                    {isPasswordless ? 'Password Login' : 'Passwordless Login ✨'}
                                </Button>
                            </div>
                        </div>
                    </form>
                
                <p className="text-center text-gray-400 mt-4 font-medium">
                    {isSignIn ? 'No account yet?' : 'Have an account already?'}
                    <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-violet-400 hover:text-blue-400 ml-2 transition-colors">
                        {!isSignIn ? "Sign in" : 'Sign up'}
                    </Link>
                </p>
            </div>
        </div>
    )
}
export default AuthForm