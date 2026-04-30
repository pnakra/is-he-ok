import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Is He OK?" },
      {
        name: "description",
        content:
          "How Is He OK? works, what it's built on, and how Override Labs handles your privacy.",
      },
      { property: "og:title", content: "About — Is He OK?" },
      {
        property: "og:description",
        content:
          "How Is He OK? works, what it's built on, and how Override Labs handles your privacy.",
      },
    ],
  }),
  component: AboutPage,
});

const HAIRLINE = "#2A2522";

function Divider() {
  return <hr className="my-12 h-px w-full border-0" style={{ backgroundColor: HAIRLINE }} />;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[22px] leading-[1.25] text-foreground sm:text-[26px]">
      {children}
    </h2>
  );
}

function P({
  children,
  muted = false,
  className = "",
}: {
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <p
      className={
        "text-[16px] leading-[1.7] " +
        (muted ? "text-muted-foreground" : "text-foreground") +
        " " +
        className
      }
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {children}
    </p>
  );
}

function Attribution({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <p
      className="mt-5 text-[16px] leading-[1.7] text-muted-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <span className="font-medium text-foreground">{name}</span>
      <span> — </span>
      {children}
    </p>
  );
}

function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col px-8 py-10 sm:px-10 sm:py-14">
        {/* Top nav: back link */}
        <div className="mb-12">
          <Link
            to="/"
            className="text-[13px] text-muted-foreground no-underline hover:underline"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ← back
          </Link>
        </div>

        {/* Title block */}
        <header>
          <h1 className="font-display text-[34px] leading-[1.15] text-foreground sm:text-[40px]">
            Is He OK?
          </h1>
          <p
            className="mt-3 text-[14px] text-muted-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Built by Override Labs.
          </p>
        </header>

        <Divider />

        {/* How it works */}
        <section>
          <H2>How it works</H2>
          <div className="mt-5 space-y-5">
            <P>
              You type in something he said — a text, a remark, a comment that's been
              sitting with you. The tool reads it through a set of frameworks developed by
              researchers and educators who study how language functions as control. It
              tells you what the sentence was wearing and what it actually did to your
              ability to think, decide, and trust yourself.
            </P>
            <P>
              It is not a diagnosis. It does not tell you who he is or what you should do.
              It tells you what one sentence did. That is the whole thing.
            </P>
          </div>
        </section>

        <Divider />

        {/* What it's built on */}
        <section>
          <H2>What it's built on</H2>
          <P className="mt-5">This tool synthesizes frameworks from:</P>

          <Attribution name="Lindsay Stoker">
            <em>The Control Code: Reclaiming Cognitive Sovereignty After Coercive Control</em>{" "}
            (2026). The four-lens analysis this tool uses — what a sentence is wearing,
            what it does, who holds authority after it lands, and whether your agency was
            preserved — is grounded in Stoker's work. We have sought to collaborate with
            her directly.
          </Attribution>

          <Attribution name="Lundy Bancroft">
            <em>Why Does He Do That?</em> (2002). The understanding that control is rooted
            in entitlement, not pathology, and that intent does not determine impact.
          </Attribution>

          <Attribution name="Evan Stark">
            <em>Coercive Control</em> (2007). The framework that maps control as a
            structural pattern of liberty deprivation rather than a collection of
            individual incidents.
          </Attribution>

          <Attribution name="Torna Pitman">
            educator and advocate whose work on the stages of coercive control informs how
            this tool calibrates what it's seeing.
          </Attribution>

          <Attribution name="Jacquelyn Campbell">
            whose Danger Assessment research established that coercive control is a
            stronger predictor of intimate partner homicide than prior physical violence.
          </Attribution>

          <Attribution name="Jane Monckton Smith">
            whose eight-stage homicide timeline maps coercive control to lethality
            progression.
          </Attribution>
        </section>

        <Divider />

        {/* Privacy */}
        <section>
          <H2>Privacy</H2>
          <div className="mt-5 space-y-5">
            <P>No account. No name. No email. Nothing that identifies you.</P>
            <P>
              When you submit a sentence, it is stored anonymously — with a random ID
              generated on your device — so Override Labs can learn from what kinds of
              things people bring here. The sentence and the analysis are stored. Nothing
              else.
            </P>
            <P>
              If you use private/incognito browsing, the random ID is not retained between
              sessions. Everything else works the same.
            </P>
          </div>
        </section>

        <Divider />

        {/* If you're in danger */}
        <section>
          <H2>If you're in danger</H2>
          <div className="mt-5 space-y-5">
            <P>
              If you are in immediate physical danger, call{" "}
              <span className="text-foreground">911</span>.
            </P>
            <P muted>
              <span className="font-medium text-foreground">
                National Domestic Violence Hotline: 1-800-799-7233
              </span>{" "}
              |{" "}
              <a
                href="https://www.thehotline.org"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-2 hover:underline"
              >
                thehotline.org
              </a>
              <br />
              Available 24/7. Chat available on their website if you can't speak freely.
            </P>
          </div>
        </section>

        <Divider />

        {/* Footer note */}
        <section className="pb-12">
          <P muted>
            Override Labs builds prevention technology. isheok.app is one of several tools
            in development. If you're a researcher, clinician, educator, or advocate who
            wants to talk about this work:{" "}
            <a
              href="mailto:overridelabspreventiontech@gmail.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              overridelabspreventiontech@gmail.com
            </a>
          </P>
        </section>
      </div>
    </main>
  );
}
