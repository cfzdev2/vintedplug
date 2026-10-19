export const BRAND_PRIMARY="#006676";

// Display previous built-in swatches in the refreshed palette without
// rewriting any saved account or financial records.
export function accountColor(color:string){
 const previous:Record<string,string>={"#087f72":BRAND_PRIMARY,"#b77848":"#418c9f","#63715c":"#456b7d"};
 return previous[color.toLowerCase()]??color;
}
