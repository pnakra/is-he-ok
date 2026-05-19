import React from "react";
import { continueRender, delayRender } from "remotion";

// Inject Google Fonts CSS via <link> tags. The @remotion/google-fonts package
// occasionally fails to register the @font-face rules in the headless renderer,
// so we mirror the link tags into <head> directly and gate render until they load.

const handle = delayRender("Loading Google Fonts");

if (typeof document !== "undefined") {
  const linkPreconnect1 = document.createElement("link");
  linkPreconnect1.rel = "preconnect";
  linkPreconnect1.href = "https://fonts.googleapis.com";
  document.head.appendChild(linkPreconnect1);

  const linkPreconnect2 = document.createElement("link");
  linkPreconnect2.rel = "preconnect";
  linkPreconnect2.href = "https://fonts.gstatic.com";
  linkPreconnect2.crossOrigin = "anonymous";
  document.head.appendChild(linkPreconnect2);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:ital,wght@0,400;1,400&display=block";
  link.onload = () => {
    // give the browser a moment to apply the @font-face rules before unblocking
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => continueRender(handle));
    } else {
      setTimeout(() => continueRender(handle), 200);
    }
  };
  link.onerror = () => continueRender(handle);
  document.head.appendChild(link);
} else {
  continueRender(handle);
}

export const FontsBoot: React.FC = () => null;
