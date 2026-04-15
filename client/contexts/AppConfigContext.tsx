import { createContext, useContext, useEffect, useState } from "react";

export type SocialLinks = {
  twitter: string;
  linkedin: string;
  github: string;
  facebook: string;
  instagram: string;
  youtube: string;
};

export type Collaborator = {
  name: string;
  role: string;
  image_url: string;
};

export type AppConfig = {
  app_name: string;
  support_email: string;
  logo_url: string;
  social_links: SocialLinks;
  collaborators: Collaborator[];
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  app_name: "LandYourJob",
  support_email: "zenlead.info@gmail.com",
  logo_url: "/logo/lo9o.png",
  social_links: {
    twitter: "",
    linkedin: "",
    github: "",
    facebook: "",
    instagram: "",
    youtube: "",
  },
  collaborators: [],
};

const AppConfigContext = createContext<AppConfig>(DEFAULT_APP_CONFIG);

export function useAppConfig(): AppConfig {
  return useContext(AppConfigContext);
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
    : "http://localhost:8000/api")
).replace(/\/$/, "");

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);

  useEffect(() => {
    fetch(`${API_BASE_URL}/settings/app-config`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.data) {
          setConfig({ ...DEFAULT_APP_CONFIG, ...d.data });
        }
      })
      .catch(() => {
        // silently use defaults
      });
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}
