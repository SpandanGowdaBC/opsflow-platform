import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-white text-2xl font-bold">OpsFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white hover:text-blue-200 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-white text-purple-900 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            One Platform to
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {' '}Rule Them All
            </span>
          </h1>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Eliminate tool chaos for service businesses. Manage leads, bookings,
            communications, forms, and inventory from a single, intelligent dashboard.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-all"
            >
              See How It Works
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="text-4xl font-bold text-white mb-2">5min</div>
              <div className="text-blue-200">To Fully Operational</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="text-4xl font-bold text-white mb-2">10+</div>
              <div className="text-blue-200">Tools Replaced</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="text-4xl font-bold text-white mb-2">80%</div>
              <div className="text-blue-200">Time Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-blue-200 text-lg">
            Stop juggling tools. Start operating smoothly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-xl p-8 hover:bg-white/15 transition-all hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-blue-200">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of service businesses running on OpsFlow
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105"
          >
            Get Started - It's Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/10">
        <div className="text-center text-blue-200">
          <p>&copy; 2026 OpsFlow. Built for CareOps Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '⚡',
    title: 'AI-Powered Lead Scoring',
    description: 'Automatically prioritize hot leads and never miss an opportunity.',
  },
  {
    icon: '📅',
    title: 'Smart Booking Engine',
    description: 'Calendar management with auto-notifications and zero customer login.',
  },
  {
    icon: '💬',
    title: 'Unified Communication',
    description: 'Email, SMS, WhatsApp all in one inbox.',
  },
  {
    icon: '📝',
    title: 'Dynamic Forms',
    description: 'Build forms and auto-send them after bookings.',
  },
  {
    icon: '📦',
    title: 'Inventory Tracking',
    description: 'Real-time monitoring with predictive alerts.',
  },
  {
    icon: '📊',
    title: 'Live Dashboard',
    description: 'See everything happening in your business, right now.',
  },
];
