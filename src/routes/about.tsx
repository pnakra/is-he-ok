import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — is he ok?" },
      {
        name: "description",
        content:
          "A small tool for reading one sentence a little more clearly. What it is, what it isn't, and how to use it.",
      },
      { property: "og:title", content: "About — is he ok?" },
      {
        property: "og:description",
        content:
          "A small tool for reading one sentence a little more clearly. What it is, what it isn't, and how to use it.",
      },
    ],
  }),
  component: AboutPage,
});

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-foreground"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "20px",
        lineHeight: 1.3,
        fontWeight: 600,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </h2>
  );
}

function P({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "16px",
        lineHeight: 1.7,
        color: muted ? "var(--color-muted-foreground)" : "var(--color-foreground)",
      }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return (
    <hr
      className="my-10 h-px w-full border-0"
      style={{ backgroundColor: "var(--color-divider)" }}
    />
  );
}

function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col px-6 py-8 sm:px-10 sm:py-12">
        <div className="mb-10 flex items-center justify-between">
          <Link
            to="/"
            className="text-[14px] text-muted-foreground no-underline hover:text-foreground hover:underline"
            style={{ fontFamily: "var(--font-sans)", textUnderlineOffset: "3px" }}
          >
            ← Back
          </Link>
          <Link
            to="/"
            className="text-[14px] no-underline hover:opacity-80"
            style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-faint)" }}
          >
            is he ok?
          </Link>
        </div>

        <header>
          <h1
            className="text-foreground"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "30px",
              lineHeight: 1.2,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            About this tool
          </h1>
        </header>

        <Divider />

        <section className="space-y-4">
          <P>This is a small tool for reading one sentence a little more clearly.</P>
          <P>
            Sometimes a line sounds small on paper but leaves you unsettled anyway. You
            paste it in, optionally add a little context, and you get a brief read of what
            it may have meant and how it may have landed.
          </P>
          <P>
            The goal here is not to deliver a verdict about a person or a relationship. It
            is to help you slow down and notice tone, framing, and possible patterns.
          </P>
          <P>
            The responses are interpretive, not definitive. They are meant to support
            reflection — not to replace your own judgment, a conversation with someone you
            trust, or professional help.
          </P>
          <P>
            If something feels confusing, repeated, or hard to name, this tool can help you
            look at it with a little more language around it.
          </P>
          <P muted>You are still the expert on what happened.</P>
        </section>

        <Divider />

        <section className="space-y-4">
          <H2>Privacy</H2>
          <P>No account. No name. No email. Nothing that identifies you.</P>
          <P>
            When you submit a sentence, it is stored anonymously — with a random ID
            generated on your device — so we can learn from what kinds of things people
            bring here. The sentence and the analysis are stored. Nothing else.
          </P>
          <P>
            If you use private or incognito browsing, the random ID is not kept between
            sessions. Everything else works the same.
          </P>
        </section>

        <Divider />

        <section className="space-y-4">
          <H2>If you feel unsafe</H2>
          <P>
            If you feel unsafe or need urgent support, please contact a trusted person or a
            qualified local resource.
          </P>
          <P>
            In the U.S., the National Domestic Violence Hotline is available 24/7 at{" "}
            <span className="text-foreground">1-800-799-7233</span>, or chat at{" "}
            <a
              href="https://www.thehotline.org"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: "var(--color-primary)", textUnderlineOffset: "3px" }}
            >
              thehotline.org
            </a>
            . If you are in immediate physical danger, call{" "}
            <span className="text-foreground">911</span>.
          </P>
        </section>

        <Divider />

        <section className="pb-12 space-y-4">
          <H2>Who made this</H2>
          <P muted>
            Built by Override Labs. If you're a researcher, clinician, educator, or
            advocate who wants to talk about this work:{" "}
            <a
              href="mailto:overridelabspreventiontech@gmail.com"
              className="hover:underline"
              style={{ color: "var(--color-primary)", textUnderlineOffset: "3px" }}
            >
              overridelabspreventiontech@gmail.com
            </a>
          </P>
        </section>
      </div>
    </main>
  );
}
