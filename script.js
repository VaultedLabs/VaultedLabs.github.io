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
  const select = document.getElementById("assetSelect");
  if (!select || !assets.length) return;
  assets.forEach((a, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = a.ticker || a.name || a.mint.slice(0, 6);
    select.appendChild(opt);
  });
  const money = (n) => {
    if (n == null || Number.isNaN(n)) return "—";
    const abs = Math.abs(n);
    if (abs >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (abs >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    if (abs >= 1) return "$" + n.toFixed(2);
    return "$" + Number(n).toPrecision(4);
  };
  const num = (n) => (n == null ? "—" : Number(n).toLocaleString());
  const pct = (n) => (n == null ? "—" : (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%");
  async function load(i) {
    const asset = assets[i];
    if (!asset) return;
    document.getElementById("assetName").textContent = asset.name || asset.ticker;
    document.getElementById("assetMeta").textContent = (asset.ticker || "") + " · solana";
    document.getElementById("linkPump").href = "https://pump.fun/coin/" + asset.mint;
    document.getElementById("linkOtc").href = "https://otcdesks.cash/coin/" + asset.mint;
    try {
      const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + asset.mint);
      const data = await res.json();
      const pair = (data.pairs || []).sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0];
      if (!pair) throw new Error("no pair");
      document.getElementById("sMcap").textContent = money(pair.marketCap || pair.fdv);
      document.getElementById("sPrice").textContent = money(Number(pair.priceUsd));
      document.getElementById("sVol").textContent = money(pair.volume?.h24);
      const chg = pair.priceChange?.h24;
      const chgEl = document.getElementById("sChg");
      chgEl.textContent = pct(chg);
      chgEl.className = chg >= 0 ? "up" : "down";
      const t24 = pair.txns?.h24 || {};
      document.getElementById("sBuys").textContent = num(t24.buys);
      document.getElementById("sSells").textContent = num(t24.sells);
      document.getElementById("linkDex").href = pair.url || ("https://dexscreener.com/solana/" + pair.pairAddress);
      document.getElementById("assetChart").src = "https://dexscreener.com/solana/" + pair.pairAddress + "?embed=1&theme=dark&trades=0&info=0";
      const windows = [["5m", "m5"], ["1h", "h1"], ["6h", "h6"], ["24h", "h24"]];
      document.getElementById("flowBody").innerHTML = windows.map(([label, key]) => {
        const t = pair.txns?.[key] || {};
        const cls = (pair.priceChange?.[key] || 0) >= 0 ? "up" : "down";
        return `<div class="flow-row"><span>${label}</span><span>${num(t.buys)}</span><span>${num(t.sells)}</span><span>${money(pair.volume?.[key])}</span><span class="${cls}">${pct(pair.priceChange?.[key])}</span></div>`;
      }).join("");
      document.getElementById("flowStamp").textContent = " / " + (pair.dexId || "live");
      const mark = pair.priceUsd;
      document.getElementById("blotterBody").innerHTML = (cfg.blotter || []).map((row) => {
        return `<div class="flow-row"><span>${row.side}</span><span>${row.ticker}</span><span>${row.size || "—"}</span><span>${row.entry || "—"}</span><span>${money(Number(mark))}</span></div>`;
      }).join("") || `<div class="flow-row"><span>—</span><span>Add fills in config.js</span><span></span><span></span><span></span></div>`;
    } catch (err) {
      document.getElementById("assetMeta").textContent = "Book offline — retry";
    }
  }
  select.addEventListener("change", () => load(Number(select.value)));
  load(0);
  setInterval(() => load(Number(select.value)), 30000);
})();
