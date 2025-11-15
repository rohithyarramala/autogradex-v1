import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import type { ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// --- Utility Components ---

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl shadow-md p-5 transition duration-300 hover:shadow-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center font-semibold text-left text-lg text-gray-800"
      >
        {question}
        <span
          className={`text-blue-600 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </span>
      </button>
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${open ? 'max-h-40 pt-4' : 'max-h-0'}`}
      >
        <p className="text-gray-600 text-left">{answer}</p>
      </div>
    </div>
  );
};

// --- Main Component ---

const Home: NextPageWithLayout = () => {
  const { data: session } = useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Updated navigation links to reflect the consolidated sections
  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Mission', href: '#mission' },
    { name: 'Story', href: '#story' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  // partnerLogos is now only used as a placeholder in the Story section
  // It is kept here as it was defined in the original component scope
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

      {/* 🚀 Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 px-5 py-4 flex justify-between items-center">
        <Link href="/">
          {/* Ensure logo path is correct and styles are responsive */}
          <Image src="/logo.png" alt="AutogradeX" width={160} height={50} />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-gray-700 font-medium hover:text-blue-600 transition duration-200"
            >
              {link.name}
            </a>
          ))}
          {session ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-md"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-md"
            >
              Sign In
            </Link>
          )}
          <a
            href="#book-demo"
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition duration-200 shadow-md"
          >
            Book Demo
          </a>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-gray-100 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="block w-6 h-0.5 bg-gray-800"></span>
          <span className="block w-6 h-0.5 bg-gray-800"></span>
          <span className="block w-6 h-0.5 bg-gray-800"></span>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed top-[70px] right-5 w-64 bg-white shadow-2xl p-6 flex flex-col gap-4 z-50 rounded-xl transition-transform duration-300 animate-in fade-in slide-in-from-top-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 font-medium border-b border-gray-100 pb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            {session ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded text-center font-semibold"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded text-center font-semibold"
              >
                Sign In
              </Link>
            )}
            <a
              href="#book-demo"
              className="bg-purple-600 text-white px-4 py-2 rounded text-center font-semibold"
            >
              Book Demo
            </a>
          </div>
        )}
      </header>
      
      {/* --- Main Content Sections --- */}
      
      {/* 🌟 Hero Section */}
      <section
        id="home"
        className="text-center py-32 bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-xl"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-5 px-2 leading-tight">
          AI-Powered Grading & Analytics for
          <br />
          <span className="text-yellow-300">Higher Education</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 font-light">
          Transforming Assessment, Empowering Educators
        </p>
        <div className="text-xl md:text-2xl font-medium tracking-wide bg-white/20 inline-block px-6 py-3 rounded-full backdrop-blur-sm shadow-inner">
          <span className="animate-pulse">⚡ Save Time | 💡 Enhance Feedback | 📈 Gain Deeper Insights</span>
        </div>
      </section>
      
      {/* 🔎 Explore Section (Video Demo) */}
      <section id="explore" className="py-20 bg-gray-50 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Explore the AutogradeX Platform
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Watch our demo video to see how AutogradeX leverages AI to automate
            grading, provide personalized feedback, and deliver valuable
            analytics, freeing up educators' time to focus on teaching.
          </p>
          <div
            className="relative w-full h-0 shadow-2xl rounded-xl overflow-hidden"
            style={{ paddingBottom: '56.25%' }}
          >
            <iframe
              src="https://www.youtube.com/embed/DLTM264sG2E" // Replace with your video link
              title="AutogradeX Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>

      {/* --- separator --- */}

      {/* ✅ Benefits (Enhanced for consistency) */}
      <section id="benefits" className="py-24 bg-white text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-16">
          The <span className="text-blue-600">Power</span> of AutogradeX
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto px-4">
          
          {/* Benefit 1 */}
          <div className="p-8 bg-blue-50 border-b-4 border-blue-600 shadow-xl rounded-xl transition duration-300 hover:shadow-2xl hover:bg-white">
            <div className="flex justify-center mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="font-bold text-2xl mb-3 text-gray-800">Automated Grading</h3>
            <p className="text-gray-600">
              Cut grading time by up to 90% with reliable, AI-driven evaluation for all assessment types, from essays to code.
            </p>
          </div>
          
          {/* Benefit 2 */}
          <div className="p-8 bg-green-50 border-b-4 border-green-600 shadow-xl rounded-xl transition duration-300 hover:shadow-2xl hover:bg-white">
            <div className="flex justify-center mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            </div>
            <h3 className="font-bold text-2xl mb-3 text-gray-800">Personalized Feedback</h3>
            <p className="text-gray-600">
              Deliver immediate, detailed, and constructive feedback tailored to each student's specific areas for improvement.
            </p>
          </div>
          
          {/* Benefit 3 */}
          <div className="p-8 bg-purple-50 border-b-4 border-purple-600 shadow-xl rounded-xl transition duration-300 hover:shadow-2xl hover:bg-white">
            <div className="flex justify-center mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
            </div>
            <h3 className="font-bold text-2xl mb-3 text-gray-800">Actionable Analytics</h3>
            <p className="text-gray-600">
              Identify class-wide trends, common learning gaps, and individual student risks with deep, actionable data insights.
            </p>
          </div>
        </div>
      </section>

      {/* --- separator --- */}
      
      {/* 🎯 Mission Section (Enhanced) */}
      <section id="mission" className="py-24 bg-gray-50 text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Our <span className="text-blue-600">Core Mission</span>
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            We are dedicated to building the future of education by making automated, intelligent assessment accessible to every classroom.
          </p>
      
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Pillar 1: Educator Empowerment */}
            <div className="p-8 bg-white border-t-4 border-blue-600 shadow-xl rounded-xl transition duration-300 hover:shadow-2xl">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2zM9 17a3 3 0 003 3c1.657 0 3-.895 3-2s-1.343-2-3-2-3-.895-3-2zM5 12h.01M19 12h.01M12 5v.01M12 19v.01"></path></svg>
              </div>
              <h3 className="font-bold text-2xl mb-3 text-gray-800">
                Reclaim Teaching Time
              </h3>
              <p className="text-gray-600">
                Automate repetitive grading tasks so educators can spend less time on paperwork and more time on high-impact instruction and student mentorship.
              </p>
            </div>
      
            {/* Pillar 2: Personalized Learning */}
            <div className="p-8 bg-white border-t-4 border-green-600 shadow-xl rounded-xl transition duration-300 hover:shadow-2xl">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l-2.5 4.5M15 10l2.5 4.5M12 21h.01M12 3v18"></path></svg>
              </div>
              <h3 className="font-bold text-2xl mb-3 text-gray-800">
                Accelerate Student Success
              </h3>
              <p className="text-gray-600">
                Provide instant, detailed feedback to students, enabling timely intervention and truly personalized learning paths driven by smart analytics.
              </p>
            </div>
      
            {/* Pillar 3: Ethical AI Innovation */}
            <div className="p-8 bg-white border-t-4 border-purple-600 shadow-xl rounded-xl transition duration-300 hover:shadow-2xl">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l-4 16m-4-4h8"></path></svg>
              </div>
              <h3 className="font-bold text-2xl mb-3 text-gray-800">
                Pioneering Responsible Tech
              </h3>
              <p className="text-gray-600">
                Drive the adoption of ethical, transparent, and highly accurate AI in academic environments, setting the standard for future EdTech.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- separator --- */}

      {/* 📖 Our Story Section (Enhanced Timeline) */}
      <section id="story" className="py-24 bg-white text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            The AutogradeX <span className="text-blue-600">Journey</span>
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            AutogradeX was founded by a team of educators and data scientists united by a common challenge: inefficient assessment.
          </p>
      
          {/* Timeline Component */}
          <div className="relative p-4">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-300 hidden md:block"></div>
      
            {/* Timeline Item 1: Inception */}
            <div className="flex flex-col md:flex-row items-center w-full mb-12">
              <div className="w-full md:w-1/2 md:pr-10 text-right">
                <h3 className="text-2xl font-semibold text-blue-600">2023: Inception & Prototype</h3>
                <p className="text-gray-600 mt-2">
                  Initial concept developed based on university pain points. Built the first successful AI model for open-ended question grading.
                </p>
              </div>
              <div className="z-10 bg-blue-600 w-4 h-4 rounded-full border-4 border-white shadow-lg flex-shrink-0 mt-4 md:mt-0"></div>
              <div className="w-full md:w-1/2 md:pl-10 text-left hidden md:block"></div> {/* Spacer */}
            </div>
      
            {/* Timeline Item 2: Seed Funding & Beta */}
            <div className="flex flex-col md:flex-row items-center w-full mb-12">
              <div className="w-full md:w-1/2 md:pr-10 text-right hidden md:block"></div> {/* Spacer */}
              <div className="z-10 bg-blue-600 w-4 h-4 rounded-full border-4 border-white shadow-lg flex-shrink-0 mt-4 md:mt-0"></div>
              <div className="w-full md:w-1/2 md:pl-10 text-left">
                <h3 className="text-2xl font-semibold text-blue-600">2024: Seed Funding & Beta Launch</h3>
                <p className="text-gray-600 mt-2">
                  Secured seed investment. Launched a successful beta program across 10 institutions, gathering crucial feedback for scaling.
                </p>
              </div>
            </div>
      
            {/* Timeline Item 3: Public Launch & Growth */}
            <div className="flex flex-col md:flex-row items-center w-full mb-12">
              <div className="w-full md:w-1/2 md:pr-10 text-right">
                <h3 className="text-2xl font-semibold text-blue-600">2025: AutogradeX 1.0 Release</h3>
                <p className="text-gray-600 mt-2">
                  Official public launch of the full suite. Expanded evaluation capacity to support over 10,000 students globally.
                </p>
              </div>
              <div className="z-10 bg-blue-600 w-4 h-4 rounded-full border-4 border-white shadow-lg flex-shrink-0 mt-4 md:mt-0"></div>
              <div className="w-full md:w-1/2 md:pl-10 text-left hidden md:block"></div> {/* Spacer */}
            </div>
          </div>
      
          {/* Partner Logos/Trust Signals */}
          <div className="mt-16 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Trusted by Innovation Leaders</h3>
              <div className="flex overflow-x-auto gap-12 py-4 justify-center">
                  {/* Using the original partnerLogos array for the actual image display */}
                  {partnerLogos.map((logo, i) => (
                    <div
                      key={i}
                      className="flex-none w-36 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition duration-300"
                    >
                      <Image
                        src={logo}
                        alt={`Partner ${i + 1}`}
                        width={140}
                        height={50}
                        className="object-contain"
                      />
                    </div>
                  ))}
              </div>
          </div>
        </div>
      </section>

      {/* --- separator --- */}

      {/* 💰 Pricing (Enhanced) */}
      <section
        id="pricing"
        className="py-24 bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            <span className="text-blue-600">Flexible</span> Pricing for Every Scale
          </h2>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your educational institution or tutoring needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan 1: autogradex_basic */}
          <div className="p-8 border border-gray-300 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                autogradex_basic
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Suitable for a single teacher, or home tutorials
              </p>
              <div className="my-6">
                <p className="text-5xl font-extrabold text-blue-600">₹ 999</p>
                <p className="text-gray-500 mt-1">/ Every Month</p>
              </div>
            </div>

            <hr className="my-6" />

            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>1</b>&nbsp;Teacher Account
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Up to &nbsp;<b>50</b>&nbsp; Students
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>100</b>&nbsp; AI Evaluations / Month
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>1</b>&nbsp; AI Revision Limit
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Basic AI Reports
              </li>
            </ul>

            <div className="mt-8 text-center">
              <a
                href="#book-demo"
                className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition duration-300 inline-block shadow-md"
              >
                Start Basic
              </a>
            </div>
          </div>

          {/* Plan 2: autogradex_standard (Highlighted) */}
          <div className="relative p-8 border-4 border-blue-600 bg-white rounded-xl shadow-2xl scale-[1.02] transition duration-500 ease-in-out">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Most Popular
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                autogradex_standard
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Suitable for Departments, Schools, and Coaching Centers
              </p>
              <div className="my-6">
                <p className="text-6xl font-extrabold text-blue-600">₹ 5,999</p>
                <p className="text-gray-500 mt-1">/ Every Month</p>
              </div>
            </div>

            <hr className="my-6 border-blue-200" />

            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Up to <b>10</b>&nbsp; Teacher Accounts
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Up to &nbsp;<b>500</b>&nbsp; Students
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>1,000</b>&nbsp; AI Evaluations / Month
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>Unlimited</b>&nbsp; AI Revisions
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>Advanced</b>&nbsp; AI Reports & Insights
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Priority Email & Chat Support
              </li>
            </ul>

            <div className="mt-8 text-center">
              <a
                href="#book-demo"
                className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-lg hover:bg-blue-700 transition duration-300 inline-block shadow-xl transform hover:scale-[1.01]"
              >
                Select Standard
              </a>
            </div>
          </div>

          {/* Plan 3: autogradex_pro */}
          <div className="p-8 border border-gray-300 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                autogradex_pro
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Suitable for organizations, university and enterprises
              </p>
              <div className="my-6">
                <p className="text-5xl font-extrabold text-gray-800">Custom</p>
                <p className="text-gray-500 mt-1">Contact for Quote</p>
              </div>
            </div>

            <hr className="my-6" />

            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>Unlimited</b>&nbsp; Teacher Accounts
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>Unlimited</b>&nbsp; Students
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>Custom</b>&nbsp; AI Evaluation Limit
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Unlimited AI Revisions
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <b>Full</b>&nbsp;Custom AI Reports & BI Integration
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Dedicated Account Manager & API Access
              </li>
            </ul>

            <div className="mt-8 text-center">
              <a
                href="#contact-sales"
                className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-900 transition duration-300 inline-block shadow-md"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-12">
          All prices are in Indian Rupees (INR) and billed every month. Need a
          different evaluation volume?{' '}
          <a
            href="#contact"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact our sales team
          </a>{' '}
          for custom quotes.
        </p>
      </section>

      {/* --- separator --- */}

      {/* ❓ FAQ */}
      <section id="faq" className="py-24 bg-white text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-12">
          Frequently <span className="text-blue-600">Asked Questions</span>
        </h2>
        <div className="max-w-4xl mx-auto space-y-6 px-4">
          <FAQItem
            question="What is the accuracy of the AI grading engine?"
            answer="Our AI engine achieves peer-level accuracy after initial training, constantly improving through human review and machine learning feedback loops. For critical assessments, human review is always available."
          />
          <FAQItem
            question="What subjects and assessment types does AutogradeX support?"
            answer="We support a wide range of subjects, including humanities, sciences, and programming. Our platform handles various assessment types, including essays, short-answer questions, project reports, and coding assignments."
          />
          <FAQItem
            question="What about student data privacy and security?"
            answer="Student data security is our top priority. All data is encrypted both in transit and at rest. We are compliant with international data protection standards (e.g., GDPR, FERPA) and do not share student data with third parties."
          />
          <FAQItem
            question="Can I integrate AutogradeX with our existing Learning Management System (LMS)?"
            answer="Yes, AutogradeX is designed for seamless integration. We support popular LMS platforms like Moodle, Canvas, and Blackboard via LTI, and we offer a comprehensive API for custom integrations."
          />
        </div>
      </section>

      {/* --- separator --- */}

      {/* 🦶 Footer */}
      <footer id="footer" className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
          
          {/* Column 1: Logo & Tagline */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-extrabold text-2xl mb-3 text-blue-400">AutogradeX</h3>
            <p className="text-gray-400">
              AI-powered grading & analytics platform transforming education for higher learning.
            </p>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-xl mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#home" className="hover:text-blue-400 transition">Home</a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-blue-400 transition">Features</a>
              </li>
              <li>
                <a href="#story" className="hover:text-blue-400 transition">Our Story</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="font-bold text-xl mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#pricing" className="hover:text-blue-400 transition">Pricing</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-400 transition">FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">Help Center</a>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Contact */}
          <div>
            <h3 className="font-bold text-xl mb-4">Get in Touch</h3>
            <p className="text-gray-400 mb-2">Email: <b>support@autogradex.com</b>&nbsp;</p>
            <p className="text-gray-400">Phone: <b>+91 12345 67890</b>&nbsp;</p>
            <a 
              href="#book-demo"
              className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Request Demo
            </a>
          </div>

        </div>
        <p className="text-center mt-12 text-sm border-t border-gray-700 pt-6 text-gray-500">
          &copy; {new Date().getFullYear()} AutogradeX. All rights reserved. Built with ❤️ for Education.
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