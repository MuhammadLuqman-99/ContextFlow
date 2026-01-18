
import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md supports-[backdrop-filter]:bg-black/20">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rounded" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        ContextFlow
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                    <Link href="#problem" className="hover:text-white transition-colors">
                        The Problem
                    </Link>
                    <Link href="#features" className="hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#pricing" className="hover:text-white transition-colors">
                        Pricing
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Sign In
                    </Link>
                    <Link href="/login">
                        <button className="group relative px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full overflow-hidden transition-all border border-white/10 hover:border-neon-purple/50">
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};
