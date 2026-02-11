import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/about": {
      en: "/about",
      pt: "/sobre",
    },
    "/projects": {
      en: "/projects",
      pt: "/projetos",
    },
    "/blog": "/blog",
    "/resume": {
      en: "/resume",
      pt: "/curriculo",
    },
    "/contact": {
      en: "/contact",
      pt: "/contato",
    },
  },
});
