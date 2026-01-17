export const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

export const BASE_URL = network === "local"
  ? process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:8080/api"
  : process.env.NEXT_PUBLIC_PROD_API_URL || "";

export const host = network === "local" ? "http://localhost:4943" : "https://icp0.io";

export const getIIURL = (): string => {
  return "https://id.ai";
};
