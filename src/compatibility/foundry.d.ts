// Foundry 0.5.0 exports loader.js but omits its advertised declaration file.
// This narrow boundary describes only the verified parse results consumed here.
declare module '@character-foundry/character-foundry/loader' {
 interface CardData {name:string;description:string;personality:string;scenario:string;mes_example:string;system_prompt:string;post_history_instructions:string;first_mes:string;alternate_greetings:string[];creator:string;tags:string[];character_book?:Record<string,unknown>}
 export function parseCard(bytes:Uint8Array):{card:{data:CardData};spec:string;assets:{ext:string;data:Uint8Array;name:string}[]};
 export function parseLorebook(bytes:Uint8Array):{book:Record<string,unknown>};
}
