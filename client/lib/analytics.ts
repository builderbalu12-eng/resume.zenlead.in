import ReactGA from "react-ga4";

export function initGA() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    ReactGA.initialize(measurementId);
  }
}

export function trackPageView() {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
}
