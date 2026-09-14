(function () {
  const cfg = window.VAULT || {};
  const links = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", () => links.classList.toggle("open"));
  }

  const caEl = document.getElementById("ca");
  const copyBtn = document.getElementById("copyBtn");
  const statusEl = document.getElementById("tokenStatus");
  if (statusEl && cfg.status) statusEl.textContent = cfg.status;

  const officialNote =
    "Official $HOLDV contract will be posted only on this site, @VaultStationHQ, and @HoldVaulted";

  if (caEl) {
    caEl.textContent = cfg.ca || "Posted at official launch only";
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const text = cfg.ca || officialNote;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = cfg.ca ? "CA copied" : "Note copied";
      } catch {
        copyBtn.textContent = "Copy failed";
      }
    });
  }

  document.querySelectorAll("[data-faq]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq");
      item.classList.toggle("open");
    });
  });

  const form = document.getElementById("studioForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const body = encodeURIComponent(
        `Name: ${data.name}\nProject: ${data.project}\nNotes: ${data.notes}`
      );
      const subject = encodeURIComponent("Vaulted Labs inquiry");
      if (cfg.email) {
        window.location.href = `mailto:${cfg.email}?subject=${subject}&body=${body}`;
      } else {
        const tweet = encodeURIComponent(
          `GM @VaultStationHQ — studio inquiry from ${data.name}: ${data.project}`
        );
        window.open(`https://x.com/intent/tweet?text=${tweet}`, "_blank");
      }
    });
  }
})();
