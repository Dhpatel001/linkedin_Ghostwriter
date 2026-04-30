import Link from 'next/link';
import StaticPageShell from '@/components/StaticPageShell';

function SupportCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[14px] border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-linkedin/30 hover:shadow-sm"
    >
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </Link>
  );
}

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title="Support and next steps"
      description="This repo did not ship with a live support inbox, so this page gives users a clean path back into the right part of the product instead of a 404."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Quick routes</h2>
        <p>
          If someone lands here while using the app, these are the fastest ways
          to get them back on track.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <SupportCard
          href="/linkedin"
          title="LinkedIn sign-in"
          body="Use this if the user needs to connect LinkedIn or restart the OAuth flow safely."
        />
        <SupportCard
          href="/billing"
          title="Billing and plans"
          body="Use this for trial questions, upgrades, renewals, or subscription troubleshooting."
        />
        <SupportCard
          href="/dashboard"
          title="Go to dashboard"
          body="Use this if the account is already connected and the user just needs to get back into the app."
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Launch note</h2>
        <p>
          Before deploying publicly, replace this starter page with your real
          support email, help desk link, or response process. Right now this is
          intentionally honest instead of guessing contact details that are not
          present in the repo.
        </p>
      </section>
    </StaticPageShell>
  );
}
