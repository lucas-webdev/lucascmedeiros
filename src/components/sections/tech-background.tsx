"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";

type TechLogo = {
  label: string;
  color: string;
  viewBox: string;
  children: ReactNode;
};

const TECH_LOGOS: TechLogo[] = [
  {
    label: "HTML5",
    color: "#E34F26",
    viewBox: "0 0 512 512",
    children: (
      <path d="M30.713.501 71.717 460.42l184.006 51.078 184.515-51.15L481.287.501zm365.041 109.145-2.567 28.596-1.128 12.681H176.204l5.155 57.761h205.565l-1.377 15.146-13.255 148.506-.849 9.523L256 413.854v.012l-.259.072-115.547-32.078-7.903-88.566h56.624l4.016 44.986 62.82 16.965.052-.014v-.006l62.916-16.977 6.542-73.158h-195.49l-13.863-155.444-1.351-15.131h282.547z" />
    ),
  },
  {
    label: "CSS3",
    color: "#1572B6",
    viewBox: "0 0 512 512",
    children: (
      <path d="m483.111.501-42.59 461.314-184.524 49.684L71.47 461.815 28.889.501zM397.29 94.302H111.866l6.885 55.708h144.78l-7.7 3.205-132.07 55.006 4.38 54.453 127.69.414 68.438.217-4.381 72.606-64.058 18.035v-.057l-.525.146-61.864-15.617-3.754-45.07h-57.789l7.511 87.007 116.423 34.429v-.062l.21.062 115.799-33.802 15.021-172.761H255.509l.323-.14 135.83-58.071z" />
    ),
  },
  {
    label: "JavaScript",
    color: "#F7DF1E",
    viewBox: "0 0 20 20",
    children: (
      <path d="M15.328 18.432c-1.745 0-2.873-.832-3.423-1.92l1.53-.886c.403.658.926 1.141 1.853 1.141.778 0 1.275-.389 1.275-.926 0-.808-1.078-1.124-1.839-1.45-1.356-.577-2.256-1.302-2.256-2.833 0-1.409 1.074-2.483 2.753-2.483 1.194 0 2.054.416 2.671 1.503l-1.463.94c-.322-.577-.671-.805-1.208-.805-.551 0-.9.349-.9.805 0 .564.349.792 1.155 1.141 1.689.724 2.967 1.293 2.967 3.155 0 1.692-1.329 2.618-3.115 2.618M11 15.599c0 1.947-1.199 2.976-2.864 2.976-1.504 0-2.405-.575-2.848-1.575h-.026l1.529-1.069c.295.523.561.894 1.205.894.618 0 1.004-.313 1.004-1.252V9h2zM0 20h20V0H0z" />
    ),
  },
  {
    label: "TypeScript",
    color: "#3178C6",
    viewBox: "0 0 15 15",
    children: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 0h15v15H0zm10 6a2 2 0 1 0 0 4h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1H8a2 2 0 0 0 2 2h1a2 2 0 1 0 0-4h-1a1 1 0 0 1 0-2h1.167c.46 0 .833.373.833.833V8h1v-.167C13 6.821 12.18 6 11.167 6zM3 6h5v1H6v6H5V7H3z"
      />
    ),
  },
  {
    label: "React",
    color: "#61DAFB",
    viewBox: "0 0 32 32",
    children: (
      <>
        <circle cx="16" cy="15.974" r="2.5" />
        <path d="M16 21.706a28.4 28.4 0 0 1-8.88-1.2 11.3 11.3 0 0 1-3.657-1.958A3.54 3.54 0 0 1 2 15.974c0-1.653 1.816-3.273 4.858-4.333A28.8 28.8 0 0 1 16 10.293a28.7 28.7 0 0 1 9.022 1.324 11.4 11.4 0 0 1 3.538 1.866A3.4 3.4 0 0 1 30 15.974c0 1.718-2.03 3.459-5.3 4.541a28.8 28.8 0 0 1-8.7 1.191m0-10.217a28 28 0 0 0-8.749 1.282c-2.8.977-4.055 2.313-4.055 3.2 0 .928 1.349 2.387 4.311 3.4A27.2 27.2 0 0 0 16 20.51a27.6 27.6 0 0 0 8.325-1.13C27.4 18.361 28.8 16.9 28.8 15.974a2.33 2.33 0 0 0-1.01-1.573 10.2 10.2 0 0 0-3.161-1.654A27.5 27.5 0 0 0 16 11.489" />
        <path d="M10.32 28.443a2.64 2.64 0 0 1-1.336-.328c-1.432-.826-1.928-3.208-1.327-6.373a28.8 28.8 0 0 1 3.4-8.593 28.7 28.7 0 0 1 5.653-7.154 11.4 11.4 0 0 1 3.384-2.133 3.4 3.4 0 0 1 2.878 0c1.489.858 1.982 3.486 1.287 6.859a28.8 28.8 0 0 1-3.316 8.133 28.4 28.4 0 0 1-5.476 7.093 11.3 11.3 0 0 1-3.523 2.189 4.9 4.9 0 0 1-1.624.307m1.773-14.7a28 28 0 0 0-3.26 8.219c-.553 2.915-.022 4.668.75 5.114.8.463 2.742.024 5.1-2.036a27.2 27.2 0 0 0 5.227-6.79 27.6 27.6 0 0 0 3.181-7.776c.654-3.175.089-5.119-.713-5.581a2.33 2.33 0 0 0-1.868.089A10.2 10.2 0 0 0 17.5 6.9a27.5 27.5 0 0 0-5.4 6.849Z" />
        <path d="M21.677 28.456c-1.355 0-3.076-.82-4.868-2.361a28.8 28.8 0 0 1-5.747-7.237 28.7 28.7 0 0 1-3.374-8.471 11.4 11.4 0 0 1-.158-4A3.4 3.4 0 0 1 8.964 3.9c1.487-.861 4.01.024 6.585 2.31a28.8 28.8 0 0 1 5.39 6.934 28.4 28.4 0 0 1 3.41 8.287 11.3 11.3 0 0 1 .137 4.146 3.54 3.54 0 0 1-1.494 2.555 2.6 2.6 0 0 1-1.315.324m-9.58-10.2a28 28 0 0 0 5.492 6.929c2.249 1.935 4.033 2.351 4.8 1.9.8-.465 1.39-2.363.782-5.434A27.2 27.2 0 0 0 19.9 13.74a27.6 27.6 0 0 0-5.145-6.64c-2.424-2.152-4.39-2.633-5.191-2.169a2.33 2.33 0 0 0-.855 1.662 10.2 10.2 0 0 0 .153 3.565 27.5 27.5 0 0 0 3.236 8.1Z" />
      </>
    ),
  },
  {
    label: "Vite",
    color: "rgb(134, 59, 255)",
    viewBox: "66 0 16 15",
    children: (
      <path d="M74.9427 14.6539C74.73 14.9246 74.295 14.7741 74.295 14.4301V11.127C74.295 10.7264 73.9704 10.4019 73.5698 10.4019H69.9228C69.6279 10.4019 69.4559 10.0683 69.6279 9.82865L72.0256 6.47163C72.3689 5.99166 72.0256 5.32454 71.4352 5.32454H67.0215C66.7266 5.32454 66.5547 4.99098 66.7266 4.75134L69.835 0.399156C69.9034 0.303852 70.0132 0.247223 70.1299 0.247223H79.393C79.6879 0.247223 79.8598 0.580784 79.6879 0.820424L77.2901 4.17745C76.9469 4.65742 77.2901 5.32454 77.8806 5.32454H81.5277C81.8301 5.32454 82 5.67329 81.8129 5.91155L74.9434 14.6546L74.9427 14.6539Z" />
    ),
  },
  {
    label: "Tailwind",
    color: "#38BDF8",
    viewBox: "0 -51 256 256",
    children: (
      <path d="M128 0Q76.8 0 64 51.2 83.2 25.6 108.8 32c9.737 2.434 16.697 9.499 24.401 17.318C145.751 62.057 160.275 76.8 192 76.8q51.2 0 64-51.2-19.2 25.6-44.8 19.2c-9.737-2.434-16.697-9.499-24.401-17.318C174.249 14.743 159.725 0 128 0M64 76.8q-51.2 0-64 51.2 19.2-25.6 44.8-19.2c9.737 2.434 16.697 9.499 24.401 17.318C81.751 138.857 96.275 153.6 128 153.6q51.2 0 64-51.2-19.2 25.6-44.8 19.2c-9.737-2.434-16.697-9.499-24.401-17.318C110.249 91.543 95.725 76.8 64 76.8" />
    ),
  },
];

type LogoState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
};

export function TechBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<LogoState[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const rafRef = useRef<number>(0);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isVisibleRef = useRef(true);

  const initLogos = useCallback(() => {
    logosRef.current = TECH_LOGOS.map(() => ({
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: 32 + Math.random() * 16,
      rotation: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    initLogos();

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      if (isVisibleRef.current) {
        const logos = logosRef.current;
        const mouse = mouseRef.current;
        const w = container.offsetWidth;
        const h = container.offsetHeight;

        for (let i = 0; i < logos.length; i++) {
          const logo = logos[i];

          logo.x += logo.vx;
          logo.y += logo.vy;
          logo.rotation += 0.08;

          if (logo.x < 0) {
            logo.x = 0;
            logo.vx *= -1;
          }
          if (logo.x > 100) {
            logo.x = 100;
            logo.vx *= -1;
          }
          if (logo.y < 0) {
            logo.y = 0;
            logo.vy *= -1;
          }
          if (logo.y > 100) {
            logo.y = 100;
            logo.vy *= -1;
          }

          let px = (logo.x / 100) * w;
          let py = (logo.y / 100) * h;

          if (mouse.x >= 0) {
            const mx = (mouse.x / 100) * w;
            const my = (mouse.y / 100) * h;
            const dx = px - mx;
            const dy = py - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200 && dist > 0) {
              const strength = (1 - dist / 200) * 30;
              px += (dx / dist) * strength;
              py += (dy / dist) * strength;
            }
          }

          const el = elementsRef.current[i];
          if (el) {
            el.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${logo.rotation}deg)`;
          }
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initLogos]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {TECH_LOGOS.map((logo, i) => (
        <div
          key={logo.label}
          ref={(el) => {
            elementsRef.current[i] = el;
          }}
          className="absolute left-0 top-0 will-change-transform"
          style={{ width: `${36 + i * 3}px`, height: `${36 + i * 3}px` }}
        >
          <svg
            viewBox={logo.viewBox}
            fill={logo.color}
            className="h-full w-full"
            style={{ opacity: 0.15 }}
          >
            {logo.children}
          </svg>
        </div>
      ))}
    </div>
  );
}
