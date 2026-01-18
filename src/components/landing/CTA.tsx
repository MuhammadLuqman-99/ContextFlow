
'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden bg-grid-white/[0.02]">
            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto rounded-3xl p-12 bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 border border-white/10 backdrop-blur-sm"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Ready to regain control <br /> of your vibe?
                    </h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Stop manually updating tickets. Start shipping. Join the new era of autonomous project management today.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login">
                            <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-xl shadow-white/10 flex items-center gap-2">
                                Get Started for Free <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
