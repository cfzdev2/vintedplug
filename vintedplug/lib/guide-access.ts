export const EARNING_GUIDE_ID="vintedplug-main";

// The configured, verified email bootstraps authorship once. Subsequent writes
// use the Site-scoped authenticated user ID stored on the guide.
export function canEditEarningGuide(userId:string,boundOwner:string|undefined,email:string,bootstrapEmail:string|undefined){
 if(boundOwner)return userId===boundOwner;
 return !!bootstrapEmail&&email.trim().toLowerCase()===bootstrapEmail.trim().toLowerCase();
}
