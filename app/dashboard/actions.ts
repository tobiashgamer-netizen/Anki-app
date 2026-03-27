'use server';

export async function genererAnkiKort(spoergsmaal: string, svar: string, brugernavn: string) {
  const scriptUrl = "https://script.google.com/macros/s/AKfycbywfjzApa69mwIVnTJLI3M8FpeSYMM8_cWxVZblaC_XUwGdCO648HpwnmnxGkUEIvwJSw/exec";
  
  try {
    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addCard',
        card: { 
          q: spoergsmaal, 
          a: svar, 
          cat: "Manuelt", 
          user: brugernavn 
        }
      })
    });
    
    return { success: true, msg: "Kortet er gemt i dit system!" };
  } catch (e) {
    return { success: false, msg: "Kunne ikke forbinde til Google." };
  }
}