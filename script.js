(function () {
  const nav = document.getElementById("navLinks");
  const btn = document.getElementById("menuBtn");
  if (btn && nav) btn.addEventListener("click", () => nav.classList.toggle("open"));
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(el.getAttribute("data-copy"));
        const prev = el.textContent;
        el.textContent = "copied";
        setTimeout(() => (el.textContent = prev), 1200);
      } catch {}
    });
  });
  const vault = document.querySelector(".vault");
  const root = document.documentElement;
  if (vault) {
    const setOpen = () => {
      const total = Math.max(vault.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-vault.getBoundingClientRect().top, 0), total);
      root.style.setProperty("--open", (scrolled / total).toFixed(4));
    };
    setOpen();
    window.addEventListener("scroll", setOpen, { passive: true });
    window.addEventListener("resize", setOpen);
  }
  const cfg = window.VAULT || {};
  const assets = cfg.assets || [];
  const refreshMs = cfg.refreshMs || 7000;
  const listEl = document.getElementById("liveList");
  if (!listEl || !assets.length) return;
  let selected = 0;
  let lastPair = "";
  const cache = [];
  const money = (n) => {
    if (n == null || Number.isNaN(n)) return "\u2014";
    const abs = Math.abs(n);
    if (abs >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (abs >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    if (abs >= 1) return "$" + n.toFixed(2);
    return "$" + Number(n).toPrecision(4);
  };
  const num = (n) => (n == null ? "\u2014" : Number(n).toLocaleString());
  const pct = (n) => (n == null ? "\u2014" : (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%");
  async function pairFor(mint) {
    const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + mint);
    const data = await res.json();
    return (data.pairs || []).sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0] || null;
  }
  function paintList() {
    listEl.innerHTML = assets.map((asset, i) => {
      const pair = cache[i];
      const t24 = pair?.txns?.h24 || {};
      const chg = pair?.priceChange?.h24;
      const cls = (chg || 0) >= 0 ? "up" : "down";
      return `<button class="coin-row${i === selected ? " on" : ""}" data-i="${i}" type="button">\n        <span><strong>${asset.ticker}</strong><small>${asset.name || ""}</small></span>\n        <span>${money(pair?.marketCap || pair?.fdv)}</span>\n        <span>${pair ? money(Number(pair.priceUsd)) : "\u2014"}</span>\n        <span>${money(pair?.volume?.h24)}</span>\n        <span class="${cls}">${pct(chg)}</span>\n        <span>${num(t24.buys)}</span>\n        <span>${num(t24.sells)}</span>\n      </button>`;
    }).join("");
    listEl.querySelectorAll("[data-i]").forEach((el) => {
      el.addEventListener("click", () => {
        selected = Number(el.getAttribute("data-i"));
        paintDetail(true);
        paintList();
      });
    });
  }
  function paintDetail(forceChart) {
    const asset = assets[selected];
    const pair = cache[selected];
    document.getElementById("assetName").textContent = asset.name || asset.ticker;
    document.getElementById("assetMeta").textContent = asset.ticker + " \u00b7 live \u00b7 7s";
    document.getElementById("linkPump").href = "https://pump.fun/coin/" + asset.mint;
    document.getElementById("linkOtc").href = "https://otcdesks.cash/coin/" + asset.mint;
    if (!pair) return;
    document.getElementById("sMcap").textContent = money(pair.marketCap || pair.fdv);
    document.getElementById("sPrice").textContent = money(Number(pair.priceUsd));
    document.getElementById("sVol").textContent = money(pair.volume?.h24);
    const chg = pair.priceChange?.h24;
    const chgEl = document.getElementById("sChg");
    chgEl.textContent = pct(chg);
    chgEl.className = chg >= 0 ? "up" : "down";
    document.getElementById("sBuys").textContent = num(pair.txns?.h24?.buys);
    document.getElementById("sSells").textContent = num(pair.txns?.h24?.sells);
    document.getElementById("linkDex").href = pair.url || ("https://dexscreener.com/solana/" + pair.pairAddress);
    if (forceChart || lastPair !== pair.pairAddress) {
      lastPair = pair.pairAddress;
      document.getElementById("assetChart").src =
        "https://dexscreener.com/solana/" + pair.pairAddress + "?embed=1&theme=dark&trades=0&info=0";
    }
    const windows = [["5m", "m5"], ["1h", "h1"], ["6h", "h6"], ["24h", "h24"]];
    document.getElementById("flowBody").innerHTML = windows.map(([label, key]) => {
      const t = pair.txns?.[key] || {};
      const cls = (pair.priceChange?.[key] || 0) >= 0 ? "up" : "down";
      return `<div class="flow-row"><span>${label}</span><span>${num(t.buys)}</span><span>${num(t.sells)}</span><span>${money(pair.volume?.[key])}</span><span class="${cls}">${pct(pair.priceChange?.[key])}</span></div>`;
    }).join("");
    document.getElementById("flowStamp").textContent = " / " + (pair.dexId || "live");
    const marks = {};
    assets.forEach((a, i) => { marks[a.ticker] = cache[i]?.priceUsd; });
    document.getElementById("blotterBody").innerHTML = (cfg.blotter || []).map((row) => {
      return `<div class="flow-row"><span>${row.side}</span><span>${row.ticker}</span><span>${row.size || "\u2014"}</span><span>${row.entry || "\u2014"}</span><span>${money(Number(marks[row.ticker]))}</span></div>`;
    }).join("");
  }
  async function tick() {
    const pulse = document.getElementById("bookPulse");
    if (pulse) pulse.textContent = "sync";
    await Promise.all(assets.map(async (asset, i) => {
      try { cache[i] = await pairFor(asset.mint); } catch { cache[i] = cache[i] || null; }
    }));
    paintList();
    paintDetail(false);
    const stamp = document.getElementById("listStamp");
    if (stamp) stamp.textContent = " / " + new Date().toLocaleTimeString();
    if (pulse) pulse.textContent = "live \u00b7 7s";
  }
  tick();
  setInterval(tick, refreshMs);
})();
