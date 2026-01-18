
'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, GitBranch, ServerCrash } from 'lucide-react';

export const ProblemSection = () => {
    return (
        <section id="problem" className="py-24 relative bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-purple/5 via-slate-900 to-slate-900" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        The <span className="text-red-500">Context Wall</span> is real.
                    </h2>
                    <p className="text-xl text-gray-400">
                        Microservices are great until you lose track of what's where.
                        Vibe coding speeds you up, but manual project management slows you down.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <GitBranch className="w-8 h-8 text-red-400" />,
                            title: "Branch Chaos",
                            description: "Dozens of feature branches across multiple repos. Which one is staging? Who knows."
                        },
                        {
                            icon: <ServerCrash className="w-8 h-8 text-orange-400" />,
                            title: "Stale Statuses",
                            description: "Jira says 'In Progress'. GitHub says 'Merged'. The truth is lost in Slack."
                        },
                        {
                            icon: <AlertTriangle className="w-8 h-8 text-yellow-400" />,
                            title: "Documentation Drift",
                            description: "Code evolves faster than your docs. Onboarding new devs becomes archaeology."
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors group"
                        >
                            <div className="mb-6 p-4 rounded-full bg-white/5 w-fit group-hover:bg-red-500/10 transition-colors">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
