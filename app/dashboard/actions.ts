'use server';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3toPy62PmxV9Dhj91Vb0sNjU8TE0DvfOdltiSObumJ8tHJyYif8Iia394edBiPtg6/exec";

export async function genererAnkiKort(spoergsmaal: string, svar: string, brugernavn: string) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addCard',
        card: {
          q: spoergsmaal,
          a: svar,
          cat: "Manuelt",
          user: brugernavn
        }
      }),
      redirect: 'follow',
    });

    return { success: true, msg: "Kortet er gemt i dit system!" };
  } catch (e) {
    return { success: false, msg: "Kunne ikke forbinde til Google." };
  }
}

export async function hentAlleKort(brugernavn?: string) {
  try {
    const url = brugernavn
      ? `${SCRIPT_URL}?action=getCards&user=${encodeURIComponent(brugernavn)}`
      : `${SCRIPT_URL}?action=getCards`;
    const res = await fetch(url, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, kort: data };
  } catch (e) {
    return { success: false, kort: [] };
  }
}

export async function hentLeaderboard() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getLeaderboard`, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, leaderboard: data };
  } catch (e) {
    return { success: false, leaderboard: [] };
  }
}