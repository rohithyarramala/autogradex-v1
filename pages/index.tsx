import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import type { ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg shadow p-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center font-medium text-left"
      >
        {question}
        <span
          className={`transform transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
        >
          ▼
        </span>
      </button>
      <div
        className={`transition-all overflow-hidden ${open ? 'max-h-40 mt-2' : 'max-h-0'}`}
      >
        <p>{answer}</p>
      </div>
    </div>
  );
};

const Home: NextPageWithLayout = () => {
  const { data: session } = useSession();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Story', href: '#story' },
    { name: 'Partners', href: '#partners' },
    { name: 'Mission', href: '#mission' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  const partnerLogos = [
    '/partners/partner1.png',
    '/partners/partner2.png',
    '/partners/partner3.png',
    '/partners/partner4.png',
    '/partners/partner5.png',
  ];

  return (
    <>
      <Head>
        <title>AutogradeX - AI-Powered Grading & Analytics</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50 px-5 py-4 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="AutogradeX" width={160} height={50} />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-blue-600 transition"
            >
              {link.name}
            </a>
          ))}
          {session ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Sign In
            </Link>
          )}
          <a
            href="#book-demo"
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Book Demo
          </a>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="block w-6 h-0.5 bg-black"></span>
          <span className="block w-6 h-0.5 bg-black"></span>
          <span className="block w-6 h-0.5 bg-black"></span>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed top-16 right-5 w-64 bg-white shadow-lg p-6 flex flex-col gap-4 z-50 rounded-lg">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            {session ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded text-center"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded text-center"
              >
                Sign In
              </Link>
            )}
            <a
              href="#book-demo"
              className="bg-purple-600 text-white px-4 py-2 rounded text-center"
            >
              Book Demo
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="text-center py-32 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          AI-Powered Grading & Analytics for Higher Education
        </h1>
        <p className="text-xl md:text-2xl mb-6">
          Transforming Assessment, Empowering Educators
        </p>
        <div className="text-lg md:text-xl animate-pulse">
          Save Time | Enhance Feedback | Gain Deeper Insights
        </div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="py-20 bg-gray-50 text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">
            Explore the AutogradeX Platform
          </h2>
          <p className="text-lg mb-10">
            Watch our demo video to see how AutogradeX leverages AI to automate
            grading, provide personalized feedback, and deliver valuable
            analytics, freeing up educators' time to focus on teaching.
          </p>
          <div
            className="relative w-full h-0"
            style={{ paddingBottom: '56.25%' }}
          >
            <iframe
              src="https://www.youtube.com/embed/DLTM264sG2E" // Replace with your video link
              title="AutogradeX Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-gray-50 text-center">
        <h2 className="text-4xl font-bold mb-12">Key Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="font-semibold text-xl mb-2">Automated Grading</h3>
            <p>Save time with AI-driven grading for all assessments.</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="font-semibold text-xl mb-2">
              Personalized Feedback
            </h3>
            <p>Provide detailed feedback tailored to each student.</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="font-semibold text-xl mb-2">Actionable Analytics</h3>
            <p>Gain insights to improve teaching and learning outcomes.</p>
          </div>
        </div>
      </section>

      {/* Story & Partners */}
      <section id="story" className="py-20 text-center max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-12">Our Story</h2>
        <p className="mb-8">
          AutogradeX started with a mission to revolutionize education through
          AI.
        </p>
        <div className="flex overflow-x-auto gap-6 py-4">
          {partnerLogos.map((logo, i) => (
            <div
              key={i}
              className="flex-none w-48 h-24 bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <Image
                src={logo}
                alt={`Partner ${i + 1}`}
                width={160}
                height={60}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-20 bg-gray-50 text-center">
        <h2 className="text-4xl font-bold mb-12">Our Mission</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="font-semibold text-xl mb-2">Empower Educators</h3>
            <p>Provide tools that save time and improve teaching quality.</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="font-semibold text-xl mb-2">Student Success</h3>
            <p>
              Enable personalized learning and better outcomes for students.
            </p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="font-semibold text-xl mb-2">Innovation</h3>
            <p>
              Drive AI innovation in education with ethical and scalable
              solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 text-center max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-12">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-200 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Basic</h3>
            <p className="mb-4">$49 / month</p>
            <ul className="text-left mb-4 list-disc list-inside">
              <li>Automated grading</li>
              <li>Basic analytics</li>
              <li>Email support</li>
            </ul>
            <a
              href="#book-demo"
              className="bg-blue-500 text-white px-4 py-2 rounded inline-block"
            >
              Book Demo
            </a>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="mb-4">$99 / month</p>
            <ul className="text-left mb-4 list-disc list-inside">
              <li>Everything in Basic</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
            <a
              href="#book-demo"
              className="bg-blue-500 text-white px-4 py-2 rounded inline-block"
            >
              Book Demo
            </a>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <p className="mb-4">Custom pricing</p>
            <ul className="text-left mb-4 list-disc list-inside">
              <li>Custom solutions</li>
              <li>Dedicated support</li>
              <li>API & integrations</li>
            </ul>
            <a
              href="#book-demo"
              className="bg-blue-500 text-white px-4 py-2 rounded inline-block"
            >
              Book Demo
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 text-center">
        <h2 className="text-4xl font-bold mb-12">FAQ</h2>
        <div className="max-w-4xl mx-auto space-y-4">
          <FAQItem
            question="What about data privacy?"
            answer="All student data is encrypted and handled securely."
          />
          <FAQItem
            question="Can I integrate with LMS?"
            answer="Yes, we support major LMS integrations."
          />
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-2">AutogradeX</h3>
            <p>
              AI-powered grading & analytics platform transforming education.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-2">Links</h3>
            <ul>
              <li>
                <Link href="#home">Home</Link>
              </li>
              <li>
                <Link href="#pricing">Pricing</Link>
              </li>
              <li>
                <Link href="#faq">FAQ</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-2">Contact</h3>
            <p>Email: support@autogradex.com</p>
            <p>Phone: +91 12345 67890</p>
          </div>
        </div>
        <p className="text-center mt-8 text-sm">
          &copy; {new Date().getFullYear()} AutogradeX. All rights reserved.
        </p>
      </footer>
    </>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { locale } = context;
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

Home.getLayout = (page: ReactElement) => <>{page}</>;

export default Home;
