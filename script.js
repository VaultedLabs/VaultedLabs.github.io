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
})();
