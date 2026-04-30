import type { ReactNode } from 'react';
import Link from 'next/link';
import StaticPageShell from '@/components/StaticPageShell';

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Privacy"
      title="How VoicePost handles your data"
      description="This page covers the core data flows used by the app today: LinkedIn sign-in, voice-profile analysis, weekly post generation, and billing state."
    >
      <Section title="What we collect">
        <p>
          VoicePost stores the basics needed to run the product: your LinkedIn
          profile details, your email address, the sample posts you submit for
          voice analysis, the generated posts we create for you, and your
          subscription status.
        </p>
        <p>
          If you use billing, the app also stores subscription identifiers and
          renewal status so access can be managed correctly.
        </p>
      </Section>

      <Section title="How we use that data">
        <p>
          Your data is used to authenticate your account, build your voice
          profile, generate draft posts in your tone, and show the right plan
          limits inside the dashboard.
        </p>
        <p>
          We do not need your raw LinkedIn password. Authentication happens
          through LinkedIn OAuth and the app stores tokens only for the
          connected-account workflow.
        </p>
      </Section>

      <Section title="LinkedIn access">
        <p>
          LinkedIn is used for sign-in and account identity. The app may also
          store the LinkedIn access token required for the connected-account
          experience.
        </p>
        <p>
          The current frontend flow opens LinkedIn for you to review and share
          approved posts yourself. The app does not silently publish content on
          your behalf from the browser.
        </p>
      </Section>

      <Section title="Your controls">
        <p>
          You can review and edit generated content before posting. You can also
          stop using the product at any time and manage plan changes from the{' '}
          <Link href="/billing" className="font-semibold text-linkedin hover:underline">
            billing page
          </Link>
          .
        </p>
        <p>
          If you deploy this project for production use, add your own retention,
          deletion, and support policies here before launch.
        </p>
      </Section>
    </StaticPageShell>
  );
}
