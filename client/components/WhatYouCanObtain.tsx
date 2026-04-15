import { useEffect, useRef, useState } from "react";

type CardConfig = {
  title: string;
  videoSrc: string;
  description: string;
};

const CARDS: CardConfig[] = [
  {
    title: "Daily AI Notifications",
    videoSrc: "/videos/telegram.mp4",
    description:
      "Instant AI notifications about new jobs daily with ready-made resumes. Get new business clients too.",
  },
  {
    title: "Auto AI Resume",
    videoSrc: "/videos/Resume_Tailor.mp4",
    description:
      "A Chrome extension that readily tailors your resume wherever you see a job post — automatically.",
  },
  {
    title: "AI Job Search",
    videoSrc: "/videos/AI_Job_Search.mp4",
    description:
      "Automatically searches LinkedIn, Naukri and many more websites and sends daily notifications. Simplest job search.",
  },
  {
    title: "Find Clients",
    videoSrc: "/videos/Find_business.mp4",
    description:
      "Easily view on the map who needs your assistance and turn it into a real business opportunity.",
  },
];

export function WhatYouCanObtain() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [videoError, setVideoError] = useState<boolean[]>(() =>
    CARDS.map(() => false),
  );

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {
            // Ignore autoplay failures (e.g. browser restrictions)
          });
        }
      }
    });
  }, []);

  const handleVideoError = (index: number) => {
    setVideoError((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">

        <div className="space-y-3 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
            <span className="mr-2">What you can</span>
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
              obtain
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Everything you need to land your dream job, automated.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-transform duration-300 hover:scale-105 cursor-pointer"
            >
              <div
                className="relative w-full overflow-hidden rounded-t-2xl"
                style={{ paddingTop: "min(100%, 320px)" }}


                >
                {/* Dark gradient overlay for title readability */}
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 55%)",
                  }}
                />

                {/* Title on top */}
                <span className="absolute top-4 left-4 z-20 text-base font-bold leading-tight text-white">
                  {card.title}
                </span>

                {/* Video or fallback */}
                {videoError[index] ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <span className="text-sm text-slate-500">
                      🎬 Preview Coming Soon
                    </span>
                  </div>
                ) : (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => handleVideoError(index)}
                  >
                    <source src={card.videoSrc} type="video/mp4" />
                  </video>
                )}
              </div>

              <div className="px-4 pb-5 pt-3">
                <p className="text-sm leading-relaxed text-slate-400">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

