import Link from 'next/link';
import { type ReactElement } from 'react';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useTheme from 'hooks/useTheme';
import env from '@/lib/env';
import Head from 'next/head';
import Image from 'next/image';
import AutogradexImage from '../public/logo.png';
import { useSession } from 'next-auth/react';
const Home: NextPageWithLayout = () => {
  const { toggleTheme, selectedTheme } = useTheme();
  const { t } = useTranslation('common');
  const { data: session } = useSession();

  const isAuthenticated = session?.user !== undefined;

  return (
    <>
      <Head>
        <title>{t('homepage-title', 'AutogradeX - AI-Powered Grading & Analytics')}</title>
      </Head>

      <div className="container mx-auto px-4">
        {/* Navigation */}
        <div className="navbar bg-base-100 px-0 sm:px-1">
          <div className="flex-1">
            <Link href="/">
              <Image src={AutogradexImage} alt='autogradex' width={160} height={50} />
            </Link>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal flex items-center gap-2 sm:gap-4">
              <li><Link href="/#home">{t('home', 'Home')}</Link></li>
              <li><Link href="/#platform">{t('platform', 'Platform')}</Link></li>
              <li><Link href="/#benefits">{t('benefits', 'Benefits')}</Link></li>
              <li><Link href="/#why-autogradex">{t('why-autogradex', 'Why AutogradeX')}</Link></li>
              <li><Link href="/#pricing">{t('pricing', 'Pricing')}</Link></li>
              <li><Link href="/#resources">{t('resources', 'Resources')}</Link></li>
              {env.darkModeEnabled && (
                <li>
                  <button
                    className="bg-none p-0 rounded-lg flex items-center justify-center"
                    onClick={toggleTheme}
                  >
                    <selectedTheme.icon className="w-5 h-5" />
                  </button>
                </li>
              )}
              {isAuthenticated && (<li>
                <Link
                  href="/dashboard"
                  className="btn btn-primary btn-md py-3 px-2 sm:px-4 text-white"
                >
                  {t('dashboard', 'Dashboard')}
                </Link>
              </li>
              )}
              {!isAuthenticated && (
              <><li>
                  <Link
                    href="/auth/login"
                    className="btn btn-primary btn-md py-3 px-2 sm:px-4 text-white"
                  >
                    {t('sign-in', 'Sign In')}
                  </Link>
                </li><li>
                    <Link
                      href="/book-demo"
                      className="btn btn-primary dark:border-zinc-600 dark:border-2 dark:text-zinc-200 btn-outline py-3 px-2 sm:px-4 btn-md"
                    >
                      {t('book-demo', 'Book a Demo')}
                    </Link>

                  </li></>
              )}
            </ul>
          </div>
        </div>

        {/* Hero Section */}
        <section id="home" className="py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">AI-Powered Grading & Analytics for Higher Education</h1>
          <h2 className="text-2xl mb-6">Transforming Assessment, Empowering Educators</h2>
          <p className="text-lg mb-8">Save Time | Enhance Feedback | Gain Deeper Insights</p>
          <Link href="/book-demo" className="btn btn-primary">Book a Demo</Link>
        </section>

        <div className="divider"></div>

        {/* Platform Section */}
        <section id="platform" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Explore the AutogradeX Platform</h2>
          <p className="text-center mb-8">
            Watch our demo video to see how AutogradeX leverages AI to automate grading, provide personalized feedback, and deliver valuable analytics, freeing up educators' time to focus on teaching.
          </p>
          <div className="flex justify-center">
            <button className="btn btn-primary">Watch Demo</button>
          </div>
        </section>

        <div className="divider"></div>

        {/* Features Section */}
        <section id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Key Innovation Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Teacher-Like AI Understanding</h3>
                <p>
                  AutogradeX's AI is designed to understand and adapt to your specific grading criteria and feedback style, making it feel like a true teaching partner.
                </p>
                <Link href="/ai-approach" className="btn btn-link">Discover Our AI Approach</Link>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Grade Assignments Your Way</h3>
                <p>
                  Train AutogradeX to mark assignments exactly as you would. Define rubric points and watch the AI consistently apply your standards.
                </p>
                <Link href="/custom-grading" className="btn btn-link">See How Custom Grading Works</Link>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Deliver Personalized Feedback Efficiently</h3>
                <p>
                  Provide students with detailed, constructive feedback by training AutogradeX to highlight specific areas and offer tailored suggestions.
                </p>
                <Link href="/ai-feedback" className="btn btn-link">Explore AI Feedback</Link>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Interact Seamlessly, Like a Colleague</h3>
                <p>
                  Our intuitive interface allows you to collaborate with AutogradeX naturally, integrating AI effortlessly into your workflow.
                </p>
                <Link href="/user-experience" className="btn btn-link">Learn About the User Experience</Link>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Benefits Section */}
        <section id="benefits" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Key Benefits for Educators & Institutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Enhanced Feedback Quality & Frequency</h3>
                <p>
                  Deliver more detailed, personalized feedback to every student, improving learning outcomes with timely insights.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Consistent & Fair Grading</h3>
                <p>
                  Ensure equitable evaluation standards across all assignments, reducing bias and improving transparency.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Deeper Performance Insights</h3>
                <p>
                  Gain comprehensive analytics on student and curriculum performance to make data-driven decisions.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Significantly Reduced Workload</h3>
                <p>
                  Save up to 80% of time on routine grading tasks, allowing more focus on teaching and student interaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Partners Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <p>
                  "AutogradeX has been a game-changer for our faculty. The amount of time saved on grading allows our teachers to focus more on student engagement and curriculum enrichment."
                </p>
                <p className="font-bold">Dr. Emily Carter, Head of Curriculum, Leading University</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <p>
                  "Implementing AutogradeX significantly improved the consistency and timeliness of feedback we provide. Integration was seamless."
                </p>
                <p className="font-bold">Prof. David Lee, Department Chair, Prestigious College</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Why AutogradeX Section */}
        <section id="why-autogradex" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story: Passion for Educational Transformation</h2>
          <p className="text-center mb-8">
            Founded by a organization of educators and AI specialists, AutogradeX was born from a deep understanding of the challenges faced in modern education.
          </p>
          <Link href="/about" className="btn btn-primary mx-auto block w-fit">Learn More About Us</Link>
        </section>

        <div className="divider"></div>

        {/* Partners Section */}
        <section id="partners" className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by Leading Educational Institutions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Placeholder for partner logos */}
            <div className="bg-gray-200 h-16 w-full"></div>
            <div className="bg-gray-200 h-16 w-full"></div>
            <div className="bg-gray-200 h-16 w-full"></div>
            <div className="bg-gray-200 h-16 w-full"></div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Mission Section */}
        <section id="mission" className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-8">Our Mission: Empowering Educators, Elevating Learning</h2>
          <p className="mb-8">
            At AutogradeX, we believe educators are the cornerstone of academic excellence. Our mission is to free them from the administrative burden of grading.
          </p>
          <Link href="/book-demo" className="btn btn-primary">Book a Demo</Link>
        </section>

        <div className="divider"></div>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-8">Pricing Designed for Institutions</h2>
          <p className="mb-8">
            AutogradeX offers flexible enterprise pricing tailored to the specific needs and scale of your educational institution.
          </p>
          <Link href="/get-quote" className="btn btn-primary">Get a Custom Quote</Link>
        </section>

        <div className="divider"></div>

        {/* Resources Section */}
        <section id="resources" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Explore Resources & Learn More</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Case Studies</h3>
                <p>See how institutions like yours are achieving success with AutogradeX.</p>
                <Link href="/case-studies" className="btn btn-link">Read Case Studies</Link>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Blog</h3>
                <p>Stay updated with the latest in EdTech, AI, and assessment strategies.</p>
                <Link href="/blog" className="btn btn-link">Visit Our Blog</Link>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Support & Help Center</h3>
                <p>Find answers to your questions and get the support you need.</p>
                <Link href="/support" className="btn btn-link">Get Support</Link>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Integrations</h3>
                <p>Learn about our seamless integrations with popular LMS/SIS platforms.</p>
                <Link href="/integrations" className="btn btn-link">View Integrations</Link>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* FAQ Section */}
        <section id="faq" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Your Questions, Answered</h2>
          <div className="space-y-4">
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">What about data privacy and security?</summary>
              <div className="collapse-content">
                <p>
                  AutogradeX prioritizes data privacy and security with end-to-end encryption, robust access controls, and compliance with global data protection laws like GDPR.
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">How much time does it take for a teacher to learn?</summary>
              <div className="collapse-content">
                <p>
                  Onboarding is fast and intuitive. Most teachers can start using AutogradeX for basic grading within a single training session (1-2 hours).
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">How many assignments before AutogradeX saves significant time?</summary>
              <div className="collapse-content">
                <p>
                  Significant time savings (50-80%) typically occur after training the AI on 10-20 assignments per type.
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">Does AutogradeX integrate with our existing LMS/SIS?</summary>
              <div className="collapse-content">
                <p>
                  Yes, AutogradeX offers standard integrations with many popular LMS and SIS platforms via APIs.
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">Can AutogradeX be used in any subject or year level?</summary>
              <div className="collapse-content">
                <p>
                  AutogradeX is versatile and supports a wide range of subjects and academic levels, from high school to postgraduate studies.
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">Can I trust the accuracy of AutogradeX's grading?</summary>
              <div className="collapse-content">
                <p>
                  AutogradeX provides suggested grades based on your training, with full control to review and modify as needed.
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">What if the teacher does not moderate AutogradeX's suggestions?</summary>
              <div className="collapse-content">
                <p>
                  While not mandatory, moderation is recommended to ensure alignment and refine the AI's understanding.
                </p>
              </div>
            </details>
            <details className="collapse collapse-arrow bg-base-100">
              <summary className="collapse-title">How is AutogradeX different from standard plagiarism checkers?</summary>
              <div className="collapse-content">
                <p>
                  AutogradeX is a comprehensive grading platform that automates scoring, provides detailed feedback, and offers performance insights, beyond just plagiarism detection.
                </p>
              </div>
            </details>
          </div>
        </section>

        <div className="divider"></div>

        {/* Footer */}
        <footer className="py-16 bg-base-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/#home">Home</Link></li>
                <li><Link href="/#platform">Platform</Link></li>
                <li><Link href="/#benefits">Benefits</Link></li>
                <li><Link href="/#testimonials">Testimonials</Link></li>
                <li><Link href="/#why-autogradex">Why AutogradeX</Link></li>
                <li><Link href="/#partners">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Learn More</h3>
              <ul className="space-y-2">
                <li><Link href="/#pricing">Pricing</Link></li>
                <li><Link href="/#resources">Resources</Link></li>
                <li><Link href="/#faq">FAQs</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <Link href="https://facebook.com"><span className="icon">FB</span></Link>
                <Link href="https://twitter.com"><span className="icon">TW</span></Link>
                <Link href="https://linkedin.com"><span className="icon">LI</span></Link>
                <Link href="https://youtube.com"><span className="icon">YT</span></Link>
                <Link href="https://instagram.com"><span className="icon">IG</span></Link>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>© 2025 AutogradeX. All Rights Reserved.</p>
            <p>
              <Link href="/privacy-policy">Privacy Policy</Link> | <Link href="/terms-of-service">Terms of Service</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  if (env.hideLandingPage) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: true,
      },
    };
  }

  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export default Home;