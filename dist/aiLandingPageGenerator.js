"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AILandingPageGenerator = void 0;
const templateEngine_1 = require("./templateEngine");
class AILandingPageGenerator {
    constructor() {
        this.templateEngine = new templateEngine_1.TemplateEngine();
    }
    parsePrompt(prompt) {
        const normalizedPrompt = prompt.toLowerCase();
        // Extract business type/industry from prompt
        const businessKeywords = {
            tech: ['tech', 'software', 'app', 'platform', 'saas', 'api', 'development', 'coding'],
            healthcare: ['health', 'medical', 'clinic', 'doctor', 'wellness', 'therapy'],
            finance: ['finance', 'banking', 'investment', 'crypto', 'trading', 'payment'],
            ecommerce: ['store', 'shop', 'product', 'ecommerce', 'retail', 'marketplace'],
            education: ['education', 'course', 'learning', 'training', 'school', 'university'],
            marketing: ['marketing', 'agency', 'advertising', 'brand', 'seo', 'social media'],
            consulting: ['consulting', 'advisory', 'consulting', 'professional services'],
            food: ['restaurant', 'food', 'cafe', 'delivery', 'catering', 'kitchen'],
            fitness: ['fitness', 'gym', 'workout', 'training', 'sports', 'exercise']
        };
        let detectedType = 'tech'; // default
        for (const [type, keywords] of Object.entries(businessKeywords)) {
            if (keywords.some(keyword => normalizedPrompt.includes(keyword))) {
                detectedType = type;
                break;
            }
        }
        // Theme selection based on business type
        const themeMapping = {
            tech: { palette: 'blue', font: 'inter' },
            healthcare: { palette: 'emerald', font: 'inter' },
            finance: { palette: 'blue', font: 'roboto' },
            ecommerce: { palette: 'orange', font: 'poppins' },
            education: { palette: 'purple', font: 'inter' },
            marketing: { palette: 'orange', font: 'montserrat' },
            consulting: { palette: 'blue', font: 'roboto' },
            food: { palette: 'orange', font: 'poppins' },
            fitness: { palette: 'emerald', font: 'montserrat' }
        };
        // Extract title and description
        const titleMatch = prompt.match(/(?:for|called|named)\s+["']([^"']+)["']/i) ||
            prompt.match(/^([A-Z][^.!?]+)/);
        const extractedTitle = titleMatch ? titleMatch[1] : this.generateTitle(detectedType);
        // Generate content based on business type
        const contentTemplates = this.getContentTemplates(detectedType, prompt);
        // Determine sections based on prompt keywords
        const sectionKeywords = {
            features: ['feature', 'benefit', 'advantage', 'capability', 'functionality'],
            testimonials: ['testimonial', 'review', 'customer', 'feedback', 'success story'],
            pricing: ['pricing', 'price', 'plan', 'cost', 'subscription', 'package'],
            faq: ['faq', 'question', 'help', 'support', 'frequently asked'],
            contact: ['contact', 'get in touch', 'reach out', 'support']
        };
        const sections = [
            { type: 'hero', content: contentTemplates.hero, animation: 'fade' }
        ];
        // Add features section by default
        sections.push({ type: 'features', content: contentTemplates.features, animation: 'slide' });
        // Add sections based on prompt content
        for (const [sectionType, keywords] of Object.entries(sectionKeywords)) {
            if (keywords.some(keyword => normalizedPrompt.includes(keyword))) {
                sections.push({
                    type: sectionType,
                    content: contentTemplates[sectionType],
                    animation: 'fade'
                });
            }
        }
        // Always add CTA and footer
        if (!sections.some(s => s.type === 'cta')) {
            sections.push({ type: 'cta', content: contentTemplates.cta, animation: 'zoom' });
        }
        sections.push({ type: 'footer', content: {}, animation: 'none' });
        // Features based on prompt
        const features = {
            darkModeToggle: normalizedPrompt.includes('dark mode') || normalizedPrompt.includes('theme'),
            smoothScrolling: true, // default to true for better UX
            lazyLoading: normalizedPrompt.includes('performance') || normalizedPrompt.includes('fast'),
            mobileMenu: normalizedPrompt.includes('mobile') || normalizedPrompt.includes('responsive'),
            backToTop: sections.length > 4 // add if many sections
        };
        return {
            title: extractedTitle,
            description: this.generateDescription(extractedTitle, detectedType),
            theme: themeMapping[detectedType],
            sections,
            features
        };
    }
    generateTitle(businessType) {
        const titles = {
            tech: 'Innovative Tech Solutions',
            healthcare: 'Advanced Healthcare Services',
            finance: 'Smart Financial Solutions',
            ecommerce: 'Premium Online Store',
            education: 'Learn & Grow Platform',
            marketing: 'Digital Marketing Excellence',
            consulting: 'Professional Consulting Services',
            food: 'Delicious Food Experience',
            fitness: 'Transform Your Fitness Journey'
        };
        return titles[businessType] || 'Your Business Solution';
    }
    generateDescription(title, businessType) {
        const descriptions = {
            tech: `${title} - Cutting-edge technology solutions that transform your business and drive growth.`,
            healthcare: `${title} - Comprehensive healthcare services focused on your wellbeing and recovery.`,
            finance: `${title} - Trusted financial solutions to secure your future and maximize your wealth.`,
            ecommerce: `${title} - Premium products and exceptional shopping experience delivered to your door.`,
            education: `${title} - Expert-led courses and training programs to advance your skills and career.`,
            marketing: `${title} - Strategic marketing solutions that amplify your brand and drive results.`,
            consulting: `${title} - Expert consulting services to optimize your business operations and strategy.`,
            food: `${title} - Fresh, delicious food crafted with care and delivered with excellence.`,
            fitness: `${title} - Personalized fitness programs and expert guidance for your health goals.`
        };
        return descriptions[businessType] ||
            `${title} - Professional solutions tailored to your needs.`;
    }
    getContentTemplates(businessType, originalPrompt) {
        // Extract specific details from the prompt
        const hasCustomContent = originalPrompt.length > 50;
        const templates = {
            tech: {
                hero: {
                    headline: hasCustomContent ?
                        'Transform Your Business with Innovation' :
                        'Revolutionary Technology Solutions',
                    subheadline: hasCustomContent ?
                        'Leverage cutting-edge technology to streamline operations, boost productivity, and accelerate growth with our comprehensive platform.' :
                        'Advanced software solutions designed to transform your business operations and drive sustainable growth.',
                    ctaText: 'Start Free Trial'
                },
                features: {
                    features: [
                        { icon: 'check', title: 'Easy Integration', description: 'Seamlessly integrate with your existing systems and workflows.' },
                        { icon: 'users', title: 'Team Collaboration', description: 'Work together efficiently with real-time collaboration tools.' },
                        { icon: 'chart', title: 'Advanced Analytics', description: 'Get actionable insights with comprehensive reporting and analytics.' }
                    ]
                },
                cta: {
                    headline: 'Ready to Transform Your Business?',
                    subheadline: 'Join thousands of companies already using our platform to drive growth and innovation.',
                    primaryCta: 'Get Started Now',
                    secondaryCta: 'Schedule Demo'
                }
            },
            healthcare: {
                hero: {
                    headline: 'Your Health, Our Priority',
                    subheadline: 'Comprehensive healthcare services with compassionate care, advanced technology, and personalized treatment plans.',
                    ctaText: 'Book Appointment'
                },
                features: {
                    features: [
                        { icon: 'check', title: 'Expert Care', description: 'Board-certified physicians with years of specialized experience.' },
                        { icon: 'users', title: 'Personalized Treatment', description: 'Customized care plans tailored to your unique health needs.' },
                        { icon: 'chart', title: 'Advanced Technology', description: 'State-of-the-art medical equipment and innovative treatments.' }
                    ]
                },
                cta: {
                    headline: 'Take Control of Your Health Today',
                    subheadline: 'Schedule your consultation and start your journey to better health.',
                    primaryCta: 'Book Now',
                    secondaryCta: 'Learn More'
                }
            },
            finance: {
                hero: {
                    headline: 'Secure Your Financial Future',
                    subheadline: 'Expert financial planning and investment solutions to help you build wealth and achieve your financial goals.',
                    ctaText: 'Get Started'
                },
                features: {
                    features: [
                        { icon: 'check', title: 'Expert Advisors', description: 'Certified financial planners with decades of experience.' },
                        { icon: 'users', title: 'Personalized Strategy', description: 'Custom investment strategies based on your goals and risk tolerance.' },
                        { icon: 'chart', title: 'Performance Tracking', description: 'Real-time portfolio monitoring and detailed performance reports.' }
                    ]
                },
                cta: {
                    headline: 'Start Building Wealth Today',
                    subheadline: 'Take the first step towards financial independence with our expert guidance.',
                    primaryCta: 'Get Consultation',
                    secondaryCta: 'View Plans'
                }
            },
            // Add more business type templates as needed...
            default: {
                hero: {
                    headline: 'Exceptional Solutions for Your Business',
                    subheadline: 'Professional services and innovative solutions designed to help your business thrive in today\'s competitive market.',
                    ctaText: 'Get Started'
                },
                features: {
                    features: [
                        { icon: 'check', title: 'Professional Service', description: 'High-quality solutions delivered by experienced professionals.' },
                        { icon: 'users', title: 'Customer Focus', description: 'Dedicated support and personalized attention to your needs.' },
                        { icon: 'chart', title: 'Proven Results', description: 'Track record of success with measurable outcomes.' }
                    ]
                },
                cta: {
                    headline: 'Ready to Get Started?',
                    subheadline: 'Contact us today to learn how we can help your business succeed.',
                    primaryCta: 'Contact Us',
                    secondaryCta: 'Learn More'
                }
            }
        };
        return templates[businessType] || templates.default;
    }
    async generateLandingPage(prompt) {
        // Parse the user prompt to extract structured data
        const parsedContent = this.parsePrompt(prompt.userInput);
        // Create template data
        const templateData = {
            title: parsedContent.title,
            description: parsedContent.description,
            theme: parsedContent.theme,
            sections: parsedContent.sections,
            features: parsedContent.features
        };
        // Generate HTML using the template engine
        return this.templateEngine.generateHTML(templateData);
    }
    // Method to get a preview of what would be generated without full HTML
    previewGeneration(prompt) {
        return this.parsePrompt(prompt);
    }
}
exports.AILandingPageGenerator = AILandingPageGenerator;
