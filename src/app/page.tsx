"use client";

import { useEffect } from "react";

export default function RootPage() {
  useEffect(() => {
    const browserLang = navigator.language?.toLowerCase() || "";
    const locale = browserLang.startsWith("pt") ? "pt" : "en";
    window.location.replace(`/${locale}/`);
  }, []);

  return null;
}
