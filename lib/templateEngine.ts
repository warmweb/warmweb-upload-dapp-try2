export interface TemplateData {
  title: string;
  description: string;
  theme: {
    palette: string;
    font: string;
    logo?: string;
  };
  sections: Array<{
    type: string;
    content: any;
    animation: string;
  }>;
  features?: {
    darkModeToggle: boolean;
    smoothScrolling: boolean;
    lazyLoading: boolean;
    mobileMenu: boolean;
    backToTop: boolean;
  };
}

export class TemplateEngine {
  private getColorPalette(palette: string) {
    const palettes = {
      blue: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#EFF6FF',
        text: '#1F2937',
      },
      emerald: {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#ECFDF5',
        text: '#1F2937',
      },
      purple: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#F3E8FF',
        text: '#1F2937',
      },
      orange: {
        primary: '#F97316',
        secondary: '#EA580C',
        accent: '#FFF7ED',
        text: '#1F2937',
      },
    };
    return palettes[palette as keyof typeof palettes] || palettes.blue;
  }

  private getFontFamily(font: string) {
    const fonts = {
      inter: "'Inter', sans-serif",
      roboto: "'Roboto', sans-serif",
      poppins: "'Poppins', sans-serif",
      montserrat: "'Montserrat', sans-serif",
    };
    return fonts[font as keyof typeof fonts] || fonts.inter;
  }

  private getAnimationCSS(animation: string) {
    const animations = {
      fade: `
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease-in-out forwards;
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `,
      slide: `
        .animate-slide-up {
          transform: translateY(50px);
          opacity: 0;
          animation: slideUp 0.8s ease-out forwards;
        }
        @keyframes slideUp {
          to { transform: translateY(0); opacity: 1; }
        }
      `,
      parallax: `
        .animate-parallax {
          transform: translateY(20px);
          opacity: 0;
          animation: parallax 1s ease-out forwards;
        }
        @keyframes parallax {
          to { transform: translateY(0); opacity: 1; }
        }
      `,
      zoom: `
        .animate-zoom-in {
          transform: scale(0.9);
          opacity: 0;
          animation: zoomIn 0.8s ease-out forwards;
        }
        @keyframes zoomIn {
          to { transform: scale(1); opacity: 1; }
        }
      `,
      none: '',
    };
    return animations[animation as keyof typeof animations] || '';
  }

  private generateSectionHTML(section: any, content: any = {}) {
    const animationClass = section.animation !== 'none' ? `animate-${section.animation.replace('_', '-')}` : '';

    switch (section.type) {
      case 'hero':
        return `
          <section class="hero-section bg-gradient-to-br from-primary to-secondary text-white py-20 ${animationClass}">
            <div class="container mx-auto px-6 text-center">
              <h1 class="text-5xl font-bold mb-6">${content.headline || 'Welcome to Our Amazing Product'}</h1>
              <p class="text-xl mb-8 max-w-3xl mx-auto">${content.subheadline || 'Transform your business with our innovative solution that delivers results you can measure.'}</p>
              <button class="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">${content.ctaText || 'Get Started Today'}</button>
            </div>
          </section>
        `;

      case 'features':
        const features = content.features || [
          { icon: 'check', title: 'Easy to Use', description: 'Intuitive interface that anyone can master in minutes.' },
          { icon: 'users', title: 'Team Collaboration', description: 'Work together seamlessly with your entire team.' },
          { icon: 'chart', title: 'Advanced Analytics', description: 'Get detailed insights into your performance.' }
        ];

        return `
          <section class="features-section py-20 bg-gray-50 ${animationClass}">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-center mb-16">${content.headline || 'Powerful Features'}</h2>
              <div class="grid md:grid-cols-3 gap-8">
                ${features.map((feature: any) => `
                  <div class="feature-card bg-white p-8 rounded-xl shadow-lg text-center">
                    <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        ${this.getIconSVG(feature.icon)}
                      </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-3">${feature.title}</h3>
                    <p class="text-gray-600">${feature.description}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'testimonials':
        const testimonials = content.testimonials || [
          { name: 'Sarah Johnson', company: 'TechStart', role: 'CEO', quote: 'This product has completely transformed how we work. The results speak for themselves - we\'ve seen a 40% increase in productivity.' },
          { name: 'Mike Chen', company: 'Digital Agency', role: 'Founder', quote: 'Outstanding support and incredible features. Our team couldn\'t be happier with the switch to this platform.' }
        ];

        return `
          <section class="testimonials-section py-20 ${animationClass}">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-center mb-16">${content.headline || 'What Our Customers Say'}</h2>
              <div class="grid md:grid-cols-2 gap-8">
                ${testimonials.map((testimonial: any, index: number) => `
                  <div class="testimonial-card bg-white p-8 rounded-xl shadow-lg">
                    <div class="flex items-center mb-4">
                      <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4 text-white font-bold">
                        ${testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <h4 class="font-semibold">${testimonial.name}</h4>
                        <p class="text-gray-600 text-sm">${testimonial.role}, ${testimonial.company}</p>
                      </div>
                    </div>
                    <p class="text-gray-700">"${testimonial.quote}"</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'pricing':
        const plans = content.plans || [
          { name: 'Starter', price: 29, features: ['Up to 5 projects', 'Basic analytics', 'Email support'] },
          { name: 'Professional', price: 79, features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Team collaboration'], featured: true },
          { name: 'Enterprise', price: 199, features: ['Everything in Pro', 'Custom integrations', 'Dedicated manager'] }
        ];

        return `
          <section class="pricing-section py-20 bg-gray-50 ${animationClass}">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-center mb-16">${content.headline || 'Simple, Transparent Pricing'}</h2>
              <div class="grid md:grid-cols-3 gap-8">
                ${plans.map((plan: any) => `
                  <div class="pricing-card ${plan.featured ? 'bg-primary text-white transform scale-105' : 'bg-white'} p-8 rounded-xl shadow-lg text-center">
                    <h3 class="text-xl font-semibold mb-4">${plan.name}</h3>
                    <div class="text-4xl font-bold mb-6">$${plan.price}<span class="text-lg ${plan.featured ? 'opacity-80' : 'text-gray-600'}">/mo</span></div>
                    <ul class="text-left space-y-3 mb-8">
                      ${plan.features.map((feature: string) => `
                        <li class="flex items-center">
                          <span class="${plan.featured ? 'text-green-300' : 'text-green-500'} mr-2">✓</span>
                          ${feature}
                        </li>
                      `).join('')}
                    </ul>
                    <button class="w-full ${plan.featured ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:bg-secondary'} py-3 rounded-lg transition-colors">Choose Plan</button>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'faq':
        const faqs = content.faqs || [
          { question: 'How does the free trial work?', answer: 'You get full access to all features for 14 days. No credit card required, and you can cancel anytime.' },
          { question: 'Can I change plans later?', answer: 'Absolutely! You can upgrade or downgrade your plan at any time from your account settings.' },
          { question: 'Is my data secure?', answer: 'Yes, we use enterprise-grade security with end-to-end encryption to protect all your data.' }
        ];

        return `
          <section class="faq-section py-20 ${animationClass}">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-center mb-16">${content.headline || 'Frequently Asked Questions'}</h2>
              <div class="max-w-3xl mx-auto space-y-4">
                ${faqs.map((faq: any) => `
                  <div class="faq-item bg-white p-6 rounded-xl shadow-lg">
                    <h3 class="text-lg font-semibold mb-3">${faq.question}</h3>
                    <p class="text-gray-600">${faq.answer}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'cta':
        return `
          <section class="cta-section bg-gradient-to-r from-primary to-secondary text-white py-20 ${animationClass}">
            <div class="container mx-auto px-6 text-center">
              <h2 class="text-4xl font-bold mb-6">${content.headline || 'Ready to Get Started?'}</h2>
              <p class="text-xl mb-8 max-w-2xl mx-auto">${content.subheadline || 'Join thousands of satisfied customers who have transformed their business with our solution.'}</p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">${content.primaryCta || 'Start Free Trial'}</button>
                <button class="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-primary transition-colors">${content.secondaryCta || 'Contact Sales'}</button>
              </div>
            </div>
          </section>
        `;

      case 'contact':
        return `
          <section class="contact-section py-20 bg-gray-50 ${animationClass}">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-center mb-16">${content.headline || 'Get In Touch'}</h2>
              <div class="max-w-2xl mx-auto">
                <form class="bg-white p-8 rounded-xl shadow-lg space-y-6">
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="John">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Doe">
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="john@example.com">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea rows="4" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="How can we help you?"></textarea>
                  </div>
                  <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition-colors">Send Message</button>
                </form>
              </div>
            </div>
          </section>
        `;

      case 'footer':
        return `
          <footer class="footer-section bg-gray-900 text-white py-16 ${animationClass}">
            <div class="container mx-auto px-6">
              <div class="grid md:grid-cols-4 gap-8">
                <div>
                  <h3 class="text-xl font-bold mb-4">Company</h3>
                  <ul class="space-y-2">
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Careers</a></li>
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h3 class="text-xl font-bold mb-4">Product</h3>
                  <ul class="space-y-2">
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Features</a></li>
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Integrations</a></li>
                  </ul>
                </div>
                <div>
                  <h3 class="text-xl font-bold mb-4">Support</h3>
                  <ul class="space-y-2">
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                    <li><a href="#" class="text-gray-300 hover:text-white transition-colors">API Reference</a></li>
                  </ul>
                </div>
                <div>
                  <h3 class="text-xl font-bold mb-4">Connect</h3>
                  <div class="flex space-x-4">
                    <a href="#" class="text-gray-300 hover:text-white transition-colors">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                    <a href="#" class="text-gray-300 hover:text-white transition-colors">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <div class="border-t border-gray-800 mt-12 pt-8 text-center">
                <p class="text-gray-400">&copy; 2024 Your Company. All rights reserved.</p>
              </div>
            </div>
          </footer>
        `;

      default:
        return '';
    }
  }

  private getIconSVG(iconType: string): string {
    const icons = {
      check: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
      users: '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>',
      chart: '<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>'
    };
    return icons[iconType as keyof typeof icons] || icons.check;
  }

  generateHTML(data: TemplateData): string {
    const colors = this.getColorPalette(data.theme.palette);
    const fontFamily = this.getFontFamily(data.theme.font);
    const animations = data.sections.map(s => this.getAnimationCSS(s.animation)).join('\n');

    const sectionsHTML = data.sections.map(section => this.generateSectionHTML(section, section.content)).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <meta name="description" content="${data.description}">

    <!-- Open Graph Tags -->
    <meta property="og:title" content="${data.title}">
    <meta property="og:description" content="${data.description}">
    <meta property="og:type" content="website">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${data.theme.font.charAt(0).toUpperCase() + data.theme.font.slice(1)}:wght@400;500;600;700&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary: ${colors.primary};
            --secondary: ${colors.secondary};
            --accent: ${colors.accent};
            --text: ${colors.text};
        }

        ${data.features?.darkModeToggle ? `
        .dark {
            --primary: ${colors.primary};
            --secondary: ${colors.secondary};
            --accent: #1a1a1a;
            --text: #ffffff;
        }

        body.dark {
            background-color: #0f0f0f;
            color: #ffffff;
        }

        .dark .bg-white { background-color: #1a1a1a; }
        .dark .bg-gray-50 { background-color: #0f0f0f; }
        .dark .text-gray-600 { color: #a1a1a1; }
        .dark .text-gray-700 { color: #d1d5db; }
        .dark .border-gray-200 { border-color: #374151; }
        ` : ''}

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${fontFamily};
            line-height: 1.6;
            color: var(--text);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .secondary { color: var(--secondary); }
        .bg-secondary { background-color: var(--secondary); }

        /* Responsive utilities */
        @media (max-width: 768px) {
            .md\\:grid-cols-2 { grid-template-columns: 1fr; }
            .md\\:grid-cols-3 { grid-template-columns: 1fr; }
            .md\\:grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
            .sm\\:flex-row { flex-direction: column; }
            .text-5xl { font-size: 2.5rem; }
            .text-4xl { font-size: 2rem; }
        }

        /* Grid system */
        .grid { display: grid; gap: 1rem; }
        .grid-cols-1 { grid-template-columns: 1fr; }
        .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }

        /* Flexbox */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .sm\\:flex-row { flex-direction: row; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .space-x-2 > * + * { margin-left: 0.5rem; }
        .space-x-4 > * + * { margin-left: 1rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-3 > * + * { margin-top: 0.75rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }

        /* Typography */
        .text-sm { font-size: 0.875rem; }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-4xl { font-size: 2.25rem; }
        .text-5xl { font-size: 3rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }

        /* Colors */
        .text-white { color: white; }
        .text-gray-600 { color: #4B5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-900 { color: #111827; }
        .text-gray-300 { color: #D1D5DB; }
        .text-gray-400 { color: #9CA3AF; }
        .text-green-500 { color: #10B981; }
        .text-green-300 { color: #6EE7B7; }
        .bg-white { background-color: white; }
        .bg-gray-50 { background-color: #F9FAFB; }
        .bg-gray-100 { background-color: #F3F4F6; }
        .bg-gray-900 { background-color: #111827; }
        .bg-gray-800 { background-color: #1F2937; }
        .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--primary), var(--secondary)); }
        .bg-gradient-to-r { background-image: linear-gradient(to right, var(--primary), var(--secondary)); }

        /* Spacing */
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .p-8 { padding: 2rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
        .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-16 { margin-bottom: 4rem; }
        .mr-2 { margin-right: 0.5rem; }
        .mr-4 { margin-right: 1rem; }
        .mt-12 { margin-top: 3rem; }
        .pt-8 { padding-top: 2rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }

        /* Sizing */
        .w-6 { width: 1.5rem; }
        .w-8 { width: 2rem; }
        .w-12 { width: 3rem; }
        .w-16 { width: 4rem; }
        .w-full { width: 100%; }
        .h-6 { height: 1.5rem; }
        .h-8 { height: 2rem; }
        .h-12 { height: 3rem; }
        .h-16 { height: 4rem; }
        .max-w-2xl { max-width: 42rem; }
        .max-w-3xl { max-width: 48rem; }

        /* Border and shadow */
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-full { border-radius: 9999px; }
        .border { border-width: 1px; }
        .border-2 { border-width: 2px; }
        .border-white { border-color: white; }
        .border-gray-300 { border-color: #D1D5DB; }
        .border-gray-800 { border-color: #1F2937; }
        .border-t { border-top-width: 1px; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }

        /* Interactive states */
        .hover\\:bg-gray-100:hover { background-color: #F3F4F6; }
        .hover\\:bg-secondary:hover { background-color: var(--secondary); }
        .hover\\:text-white:hover { color: white; }
        .hover\\:text-primary:hover { color: var(--primary); }
        .transition-colors { transition-property: color, background-color, border-color; transition-duration: 0.15s; }
        .transform { transform: translateZ(0); }
        .scale-105 { transform: scale(1.05); }

        /* Form elements */
        input, textarea, select {
            border: 1px solid #D1D5DB;
            border-radius: 0.5rem;
            padding: 0.75rem;
            width: 100%;
            font-family: inherit;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        button {
            cursor: pointer;
            border: none;
            border-radius: 0.5rem;
            font-family: inherit;
            font-weight: 600;
            transition: all 0.15s;
        }

        button:hover {
            transform: translateY(-1px);
        }

        /* Smooth scrolling */
        html {
            scroll-behavior: smooth;
        }

        /* Animations */
        ${animations}

        /* Intersection Observer trigger */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease-out;
        }

        .animate-on-scroll.in-view {
            opacity: 1;
            transform: translateY(0);
        }

        ${data.features?.smoothScrolling ? `
        html {
            scroll-behavior: smooth;
        }
        ` : ''}

        ${data.features?.backToTop ? `
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .back-to-top:hover {
            background: var(--secondary);
            transform: translateY(-2px);
        }

        .back-to-top.show {
            display: flex;
        }
        ` : ''}
    </style>
</head>
<body${data.features?.darkModeToggle ? ' id="body"' : ''}>
    <!-- Navigation -->
    <nav class="bg-white shadow-lg fixed w-full top-0 z-50">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    ${data.theme.logo ? `<img src="${data.theme.logo}" alt="Logo" class="w-8 h-8">` : '<div class="w-8 h-8 bg-primary rounded-lg"></div>'}
                    <span class="text-xl font-bold">Your Brand</span>
                </div>
                <div class="hidden md:flex space-x-6">
                    <a href="#home" class="text-gray-700 hover:text-primary transition-colors">Home</a>
                    <a href="#features" class="text-gray-700 hover:text-primary transition-colors">Features</a>
                    <a href="#pricing" class="text-gray-700 hover:text-primary transition-colors">Pricing</a>
                    <a href="#contact" class="text-gray-700 hover:text-primary transition-colors">Contact</a>
                </div>
                <button class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors">Get Started</button>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main style="margin-top: 80px;">
        ${sectionsHTML}
    </main>

    ${data.features?.darkModeToggle ? `
    <!-- Dark Mode Toggle Button -->
    <button id="theme-toggle" style="position: fixed; top: 20px; right: 20px; z-index: 1000; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px; cursor: pointer; font-size: 16px;">🌙</button>
    ` : ''}

    ${data.features?.backToTop ? `
    <!-- Back to Top Button -->
    <button class="back-to-top" id="back-to-top">↑</button>
    ` : ''}

    <script>
        ${data.features?.smoothScrolling ? `
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        ` : ''}

        ${data.features?.darkModeToggle ? `
        // Dark mode toggle
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.getElementById('body');

        if (themeToggle && body) {
            themeToggle.addEventListener('click', () => {
                body.classList.toggle('dark');
                themeToggle.textContent = body.classList.contains('dark') ? '☀️' : '🌙';
                localStorage.setItem('darkMode', body.classList.contains('dark'));
            });

            // Load saved theme
            if (localStorage.getItem('darkMode') === 'true') {
                body.classList.add('dark');
                themeToggle.textContent = '☀️';
            }
        }
        ` : ''}

        ${data.features?.backToTop ? `
        // Back to top button
        const backToTop = document.getElementById('back-to-top');

        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        ` : ''}

        ${data.features?.lazyLoading ? `
        // Lazy loading for images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
        ` : ''}

        ${data.features?.mobileMenu ? `
        // Mobile menu functionality (if navigation exists)
        const nav = document.querySelector('nav');
        if (nav && window.innerWidth <= 768) {
            const menuButton = document.createElement('button');
            menuButton.innerHTML = '☰';
            menuButton.style.cssText = 'position: fixed; top: 20px; left: 20px; z-index: 1000; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px; cursor: pointer; font-size: 16px;';
            document.body.appendChild(menuButton);

            const navItems = nav.cloneNode(true);
            navItems.style.cssText = 'position: fixed; top: 0; left: -100%; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 999; transition: left 0.3s ease; display: flex; flex-direction: column; justify-content: center; align-items: center;';
            document.body.appendChild(navItems);

            menuButton.addEventListener('click', () => {
                navItems.style.left = navItems.style.left === '0px' ? '-100%' : '0px';
            });

            navItems.addEventListener('click', () => {
                navItems.style.left = '-100%';
            });
        }
        ` : ''}

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, observerOptions);

        // Observe all sections with animations
        document.querySelectorAll('section[class*="animate-"]').forEach(section => {
            section.classList.add('animate-on-scroll');
            observer.observe(section);
        });

        // Form submission handling
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Thank you for your message! We will get back to you soon.');
            });
        });
    </script>
</body>
</html>
    `.trim();
  }
}