export const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

export const host = network === "local" ? "http://localhost:4943" : "https://icp0.io";

export const getIIURL = (): string => {
  if (network === "local") {
    const iiCanisterId = process.env.NEXT_PUBLIC_II_CANISTER_ID || "be2us-64aaa-aaaaa-qaabq-cai";
    return `http://${iiCanisterId}.localhost:4943`;
  }
  return "https://id.ai";
};
