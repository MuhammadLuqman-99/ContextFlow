
'use client';

import { motion } from 'framer-motion';
import { FileText, Activity, Share2, Lightbulb, CheckCircle2 } from 'lucide-react';

export const FeatureGrid = () => {
    return (
        <section id="features" className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[100px] animate-blob" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[100px] animate-blob animation-delay-2000" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Everything your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue">
                            vibe coding workflow
                        </span> needs.
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Card 1: Auto Documentation (Large) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-neon-purple/50 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <FileText className="w-32 h-32 text-neon-purple" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center mb-6">
                                <FileText className="w-6 h-6 text-neon-purple" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Auto-Documentation</h3>
                            <p className="text-gray-400 max-w-md">
                                Stop writing READMEs. ContextFlow parses your semantic commits and automatically generates
                                feature documentation, changelogs, and 'What's New' sections for your stakeholders.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2: Health Check */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-neon-blue/50 transition-colors group relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6 text-neon-blue" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Health Checks</h3>
                            <p className="text-gray-400">
                                Instant visibility into which microservices are stale, active, or failing tests.
                                Green means go.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 3: Dependency Mapping */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-colors group relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center mb-6">
                                <Share2 className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Dependency Map</h3>
                            <p className="text-gray-400">
                                Visualise how your vibe code changes impact other services. No more breaking prod by accident.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 4: AI Suggestions (Large) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-yellow-400/50 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Lightbulb className="w-32 h-32 text-yellow-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-yellow-400/20 flex items-center justify-center mb-6">
                                <Lightbulb className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">"What's Next?" AI</h3>
                            <p className="text-gray-400 max-w-md">
                                Not sure what to tackle? ContextFlow analyzes your project momentum and suggests the next
                                logical task to keep your flow state unbroken.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
