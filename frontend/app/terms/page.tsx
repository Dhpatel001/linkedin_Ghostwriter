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

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Terms"
      title="Ground rules for using VoicePost"
      description="These terms describe the basic expectations for using the app, generated content, subscriptions, and the current beta-style product experience."
    >
      <Section title="Using the product">
        <p>
          VoicePost helps you draft LinkedIn content based on the writing
          samples you provide. You remain responsible for reviewing all content
          before publishing it.
        </p>
        <p>
          Do not use the product to submit unlawful content, impersonate others,
          or violate the terms of any connected platform.
        </p>
      </Section>

      <Section title="AI-generated output">
        <p>
          Generated posts are suggestions, not guarantees. You should verify
          facts, claims, and brand-sensitive language before posting anything
          publicly.
        </p>
        <p>
          Because the product learns from your examples, the quality of output
          depends heavily on the quality and relevance of the posts you provide.
        </p>
      </Section>

      <Section title="Trials, plans, and billing">
        <p>
          Trial access, paid tiers, and feature limits are enforced by the app&apos;s
          billing and subscription logic. Plan details are shown on the{' '}
          <Link href="/billing" className="font-semibold text-linkedin hover:underline">
            billing page
          </Link>
          .
        </p>
        <p>
          If you deploy this repo, replace these starter terms with the legal
          language required for your business, payment processor, and region.
        </p>
      </Section>

      <Section title="Availability and support">
        <p>
          This codebase is structured like a production SaaS app, but it still
          behaves like a starter product in a few places. Features, flows, and
          support processes may change as you continue building it.
        </p>
        <p>
          Missing or custom support details should be published on the{' '}
          <Link href="/contact" className="font-semibold text-linkedin hover:underline">
            contact page
          </Link>{' '}
          before public launch.
        </p>
      </Section>
    </StaticPageShell>
  );
}
