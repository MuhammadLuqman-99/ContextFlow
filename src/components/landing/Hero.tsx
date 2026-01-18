
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-slate-950">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-neon-blue/10 rounded-full blur-[100px] opacity-20" />
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
                >
                    <Sparkles className="w-4 h-4 text-neon-purple" />
                    <span className="text-sm text-gray-300">The first AI-native project manager</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
                >
                    The Kanban Board that{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue">
                        writes itself.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
                >
                    Bridge the gap between AI-generated code and project management.
                    ContextFlow syncs your vibe coding progress to a beautiful dashboard automatically.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                >
                    <Link href="/login">
                        <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
                            Start Vibe Coding <Zap className="w-4 h-4 fill-current" />
                        </button>
                    </Link>
                    <Link href="/demo">
                        <button className="px-8 py-4 bg-white/5 text-white font-medium rounded-full border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                            View Live Demo
                        </button>
                    </Link>
                </motion.div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative w-full max-w-5xl mx-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl shadow-neon-purple/20 overflow-hidden group"
                >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="aspect-[16/9] relative">
                        <Image
                            src="/images/kanban_mockup.png"
                            alt="ContextFlow Dashboard"
                            fill
                            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
