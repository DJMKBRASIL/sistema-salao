
/*!
 * Hotfix: login labels + "Limpar Tudo" local-only
 * Works on both fichas_clientes_* and index_* pages.
 */
(function() {
  function setButtonText(btn, text) {
    if (!btn) return;
    try {
      // Preserve SVG; adjust only trailing text node
      let changed = false;
      for (let n of Array.from(btn.childNodes).reverse()) {
        if (n.nodeType === Node.TEXT_NODE) {
          n.nodeValue = " " + text;
          changed = true;
          break;
        }
      }
      if (!changed) {
        btn.appendChild(document.createTextNode(" " + text));
      }
      // Also set accessible name
      btn.setAttribute("aria-label", text);
      btn.title = text;
    } catch (e) {}
  }

  function fixLoginLabels() {
    // Google
    const googleBtn = document.querySelector('button[onclick*="signInWithGoogle"], button[onclick*="window.fichasApp.signInWithGoogle"]');
    setButtonText(googleBtn, "Entrar com Google");

    // Phone
    const phoneBtn = document.querySelector('button[onclick*="openPhoneLoginModal"], button[onclick*="openPhoneLoginModal_index"], button[onclick*="openPhoneLoginModal_fichas"]');
    setButtonText(phoneBtn, "Entrar com Telefone");
  }

  function installClearLocalOnly() {
    // Define method on salonApp (index page)
    if (!window.salonApp) {
      window.salonApp = {};
    }
    if (!window.salonApp.clearLocalOnly) {
      window.salonApp.clearLocalOnly = function() {
        try {
          this.collaborators = [];
          this.products = [];
          this.summary = { grossTotal: 0, collaboratorsTotal: 0, productsTotal: 0 };

          // UI
          const ids = ["collaboratorsContainer","productsContainer","clientsContainer","clients-container"];
          ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ""; });
          const gross = document.getElementById("grossTotal");
          if (gross) gross.textContent = "R$ 0,00";

          // Local storage keys commonly used
          const keys = ["weeklyData","weeklyData_v2","weeklyData_v3","fichas_local_cache"];
          keys.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });

          // Persist & re-render
          if (typeof this.saveLocalData === "function") this.saveLocalData();
          if (typeof this.renderAllUI === "function") this.renderAllUI();

          if (typeof window.showMessage === "function") {
            window.showMessage("Dados da tela limpos. Dados salvos na nuvem permanecem intactos.", "success");
          } else {
            alert("Dados da tela limpos (nuvem preservada).");
          }
        } catch (e) {
          console.error("Falha ao limpar localmente:", e);
          if (typeof window.showMessage === "function") {
            window.showMessage("Falha ao limpar localmente: " + (e && e.message || e), "error");
          }
        }
      };
    }

    // Redirecionar o clique do botão "Limpar Tudo" para clearLocalOnly
    const btns = Array.from(document.querySelectorAll("button"));
    const clearBtn = btns.find(b => /limpar\s+tudo/i.test(b.textContent || ""));
    if (clearBtn) {
      clearBtn.onclick = function(ev) {
        ev && ev.preventDefault && ev.preventDefault();
        ev && ev.stopPropagation && ev.stopPropagation();
        try { window.salonApp.clearLocalOnly(); } catch (e) { console.error(e); }
        return false;
      };
    }
  }

  // Observe DOM because alguns trechos criam os botões dinamicamente
  const mo = new MutationObserver(() => { fixLoginLabels(); installClearLocalOnly(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // First pass
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      fixLoginLabels(); installClearLocalOnly();
    });
  } else {
    fixLoginLabels(); installClearLocalOnly();
  }
})();
