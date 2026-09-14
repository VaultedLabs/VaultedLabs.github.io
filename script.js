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
  if (!vault) return;
  const setOpen = () => {
    const total = Math.max(vault.offsetHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(-vault.getBoundingClientRect().top, 0), total);
    root.style.setProperty("--open", (scrolled / total).toFixed(4));
  };
  setOpen();
  window.addEventListener("scroll", setOpen, { passive: true });
  window.addEventListener("resize", setOpen);
})();
