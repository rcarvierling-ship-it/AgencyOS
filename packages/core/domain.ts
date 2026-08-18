export const OPPORTUNITY_STAGES = [
  "discovered","qualified","researching","demo_building","demo_ready","contacted","responded","interested","proposal","won","lost","do_not_contact",
] as const;
export type OpportunityStage = typeof OPPORTUNITY_STAGES[number];

export const BUSINESS_STATUSES = ["prospect","qualified","contacted","interested","client","declined","do_not_contact","archived"] as const;
export type BusinessStatus = typeof BUSINESS_STATUSES[number];

export const HOSTING_MODES = ["managed","self_hosted"] as const;
export type HostingMode = typeof HOSTING_MODES[number];

export interface BusinessIdentity { id:string; name:string; slug:string; domain?:string; phone?:string; email?:string; city?:string; state?:string; country?:string; }
