
'use client';

import { motion } from 'framer-motion';
import { Terminal, BrainCircuit, LayoutDashboard, ArrowRight } from 'lucide-react';

const steps = [
    {
        icon: <Terminal className="w-8 h-8 text-neon-blue" />,
        title: "Vibe Code as Usual",
        description: "Write code, commit, and push. Use simple tags like [STATUS:DONE] in your commits."
    },
    {
        icon: <BrainCircuit className="w-8 h-8 text-neon-purple" />,
        title: "AI Updates the Vibe",
        description: "Our agent scans your progress, updates vibe.json, and suggests next steps automatically."
    },
    {
        icon: <LayoutDashboard className="w-8 h-8 text-neon-cyan" />,
        title: "Watch the Board Move",
        description: "Your Kanban board updates in real-time. No more manual dragging or ticketing."
    }
];

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-slate-950 relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-neon-blue font-semibold tracking-wider uppercase text-sm">The Flow</span>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
                        From Terminal to Board <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
                            Instantaneously
                        </span>
                    </h2>
                </motion.div>

                <div className="relative grid md:grid-cols-3 gap-12">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-cyan/30" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-8 relative z-10 shadow-lg shadow-neon-blue/5 group hover:scale-110 transition-transform duration-300">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                {step.icon}
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                                    {index + 1}
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                            <p className="text-gray-400 max-w-xs">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
