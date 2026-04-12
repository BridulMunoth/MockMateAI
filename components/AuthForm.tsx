"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import Image from "next/image";
import Link from "next/link";
import {toast} from "sonner";
import FormField from "@/components/FormField";
import {useRouter} from "next/navigation";

const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
        email: z.string().email(),
        password: z.string().min(3),
    })
}

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const formSchema = authFormSchema(type);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if(type === 'sign-up') {
                toast.success('Account created successfully. Please sign in.');
                router.push('/sign-in')
            } else {
                toast.success('Sign in successfully.');
                router.push('/')
            }
        } catch (error) {
            console.log(error);
            toast.error(`There was an error: ${error}`)
        }
    }

    const isSignIn = type === 'sign-in';

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); filter: drop-shadow(0px 8px 12px rgba(139, 92, 246, 0.4)); }
                    50% { transform: translateY(-5px); filter: drop-shadow(0px 15px 20px rgba(168, 85, 247, 0.7)); }
                  }
                  @keyframes shimmer {
                    to { background-position: -200% center; }
                  }
                  @keyframes logoFloat {
                    0%, 100% { transform: translateY(0px) scale(1.25); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
                    50% { transform: translateY(-3px) scale(1.25); filter: drop-shadow(0 8px 12px rgba(0,0,0,0.4)); }
                  }
                  .animate-super-hit {
                    animation: float 4s ease-in-out infinite;
                  }
                  .shimmer-text {
                    background: linear-gradient(90deg, #60a5fa 20%, #a78bfa 40%, #f472b6 60%, #60a5fa 80%);
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: shimmer 4s linear infinite;
                  }
                  .fancy-quote {
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 2.8rem;
                    line-height: 0;
                    margin-top: 0.15em; 
                  }
                  .logo-animated {
                    animation: logoFloat 6s ease-in-out infinite;
                  }
                `}</style>
                <div className="flex flex-row gap-2 justify-center -mt-8 -mb-10 lg:-mt-12 lg:-mb-12">
                    <Image
                        src="/AIMockMateLogoBig.jpeg"
                        alt="logo"
                        height={120}
                        width={306}
                        className="object-cover object-center logo-animated pointer-events-none select-none"
                        draggable={false}
                    />
                </div>

                <div className="flex justify-center w-full mt-4 mb-6">
                    <div className="animate-super-hit flex items-start space-x-1">
                        <span className="fancy-quote text-blue-400">“</span>
                        <h3 className="shimmer-text italic font-serif text-2xl md:text-3xl tracking-wide font-extrabold pb-1 px-1">
                            Practice job interview with AI
                        </h3>
                        <span className="fancy-quote text-pink-400">”</span>
                    </div>
                </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form">
                        {!isSignIn && (
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

                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />

                        <Button className="btn" type="submit">{isSignIn ? 'Sign in' : 'Create an Account'}</Button>
                    </form>
                
                <p className="text-center">
                    {isSignIn ? 'No account yet?' : 'Have an account already?'}
                    <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-user-primary ml-1">
                        {!isSignIn ? "Sign in" : 'Sign up'}
                    </Link>
                </p>
            </div>
        </div>
    )
}
export default AuthForm