// Leaderboard.js - Supabase global highscores
window.Leaderboard = (() => {
  const BASE = 'https://hgoanzximhyfyeqkspxo.supabase.co/rest/v1/highscores';
  const KEY  = 'sb_publishable_pGoHity9RN9Wp1mvL8AOtA_eSVLdBNB';
  const HDR  = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` };

  return {
    async submit(score, applesEaten, victory) {
      if (!score || score <= 0) return false;
      try {
        const res = await fetch(BASE, {
          method: 'POST',
          headers: { ...HDR, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            player_name: window.Storage.getPlayerName(),
            score,
            apples_eaten: applesEaten || 0,
            victory: !!victory,
          }),
        });
        return res.ok;
      } catch { return false; }
    },

    async getTop(limit = 10) {
      try {
        const res = await fetch(
          `${BASE}?select=player_name,score,victory&order=score.desc&limit=${limit}`,
          { headers: HDR }
        );
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    },
  };
})();
