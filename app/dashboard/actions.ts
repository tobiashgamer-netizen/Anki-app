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

export async function opretKort(data: {
  question: string;
  answer: string;
  category: string;
  user: string;
  public: boolean;
  deckname: string;
}) {
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      redirect: 'follow',
    });
    return { success: true };
  } catch {
    return { success: false };
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

export async function redigerKort(data: {
  row: number;
  question?: string;
  answer?: string;
  category?: string;
  public?: boolean;
  deckname?: string;
  user: string;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'editCard', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function sletKort(row: number, user: string) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteCard', row, user }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
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

export async function kopierDeck(data: {
  deckname: string;
  sourceOwner: string;
  user: string;
  newDeckname?: string;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'copyDeck', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function likeDeck(data: {
  deckname: string;
  deckOwner: string;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'likeDeck', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function rapporterFejl(data: {
  question: string;
  reporter: string;
  message: string;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'reportError', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function resolveError(data: {
  question: string;
  newQuestion?: string;
  newAnswer?: string;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'resolveError', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function verifyCard(data: {
  row: number;
  verified: boolean;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'verifyCard', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function saveBroadcast(message: string) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'saveBroadcast', message }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function hentBroadcast() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getBroadcast`, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, message: data.message || "" };
  } catch {
    return { success: false, message: "" };
  }
}

export async function logActivity(user: string) {
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'logActivity', user }),
      redirect: 'follow',
    });
  } catch { /* silent */ }
}

export async function hentActivity() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getActivity`, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, activity: data };
  } catch {
    return { success: false, activity: [] };
  }
}

export async function logAnalytics(data: {
  user: string;
  question: string;
  quality: number;
}) {
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'logAnalytics', ...data }),
      redirect: 'follow',
    });
  } catch { /* silent */ }
}

export async function hentBlindSpot() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getBlindSpot`, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, blindSpot: data };
  } catch {
    return { success: false, blindSpot: [] };
  }
}

export async function sendFeedback(data: {
  emne: string;
  beskrivelse: string;
  type: string;
  user: string;
}) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'addFeedback', ...data }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function hentFeedback() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getFeedback`, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, feedback: data };
  } catch {
    return { success: false, feedback: [] };
  }
}

export async function markFeedbackRead(row: number) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'markFeedbackRead', row }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function deleteFeedback(row: number) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteFeedback', row }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}

export async function hentAvatar(username: string) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getAvatar&username=${encodeURIComponent(username)}`, { redirect: 'follow' });
    const data = await res.json();
    return { success: true, avatar: data.avatar || "" };
  } catch {
    return { success: false, avatar: "" };
  }
}

export async function setAvatar(username: string, avatar: string) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'setAvatar', username, avatar }),
      redirect: 'follow',
    });
    const result = await res.json();
    return result;
  } catch {
    return { success: false, error: "Netværksfejl" };
  }
}