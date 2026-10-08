import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_URL, api } from "@/lib/api-client";

export interface SetupStatus {
  initialized: boolean;
  organization_name: string | null;
  /** Changes when the logo changes; null when there is no logo at all. */
  logo_version: string | null;
  /** False while the backend's default logo is shown. */
  logo_uploaded: boolean;
}

export const APP_NAME = "Promotion Engine";

export function useSetupStatus() {
  return useQuery({
    queryKey: ["setup-status"],
    queryFn: async () => (await api.get<SetupStatus>("/setup/status")).data,
    staleTime: Infinity,
    retry: 2,
  });
}

/** URL of the uploaded organisation logo; the version makes the browser fetch a replaced logo again. */
export function logoUrl(version: string | null | undefined) {
  return version
    ? `${API_URL}/api/v1/settings/logo?v=${encodeURIComponent(version)}`
    : null;
}

/** Tab title and favicon from the organisation settings and its uploaded logo. */
export function useBranding() {
  const status = useSetupStatus().data;
  const org = status?.organization_name;
  const logo = logoUrl(status?.logo_version);
  useEffect(() => {
    document.title = org ? `${org} · ${APP_NAME}` : APP_NAME;
  }, [org]);
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!logo) {
      link?.remove();
      return;
    }
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [logo]);
}
