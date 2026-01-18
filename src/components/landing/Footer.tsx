
import { Github, Twitter } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-12 bg-slate-950 border-t border-white/10 text-gray-400 text-sm">
            <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-neon-purple to-neon-blue" />
                        <span className="text-lg font-bold text-white">ContextFlow</span>
                    </div>
                    <p className="max-w-xs mb-6">
                        The mission control for vibe-coders. Bridging AI velocity with human manageability.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Product</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Legal</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/5 text-center">
                <p>© 2024 ContextFlow. All rights reserved.</p>
            </div>
        </footer>
    );
};
