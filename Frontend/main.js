     import { state } from "./state.js";

     // Debug guard
      window.addEventListener("error", (e) => {
        console.error("[GLOBAL ERROR]", e?.error || e?.message || e);
        alert(
          "JS error: " + (e?.error?.message || e?.message || "check console")
        );
      });

      // Supabase creds 
      const SUPABASE_URL = "https://ceebnevkectnlvjapidg.supabase.co";
      const SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZWJuZXZrZWN0bmx2amFwaWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDk4NTcsImV4cCI6MjA4MDkyNTg1N30.8Z-12vrB3J_Rc3Jht-YeaG2NFTiFHBisqH3Yll-_cts";

      const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      async function supabaseSmokeTest() {
        try {
          const { data, error } = await sb.from("agents").select("*").limit(1);
          if (error) throw error;
          const brand = document.querySelector(".brandwrap");
          if (brand) {
            const connected = document.createElement("span");
            connected.className = "badge";
            connected.textContent = "Supabase: Connected";
            brand.appendChild(connected);
          }
          console.log("Supabase OK. Sample agents:", data);
        } catch (err) {
          console.error("Supabase connection failed:", err);
          const brand = document.querySelector(".brandwrap");
          if (brand) {
            const badge = document.createElement("span");
            badge.className = "badge crit";
            badge.textContent = "Supabase: Error";
            brand.appendChild(badge);
          }
          alert("Supabase error: " + (err?.message || err));
        }
      }

      //  init EmailJS once, safely
      function initEmailJS() {
        if (!window.emailjs) {
          console.error("[EmailJS] library not loaded");
          return false;
        }
        try {
          emailjs.init("-6lNUhMst6-9ZiCof"); // public key
          console.log("[EmailJS] initialized");
          return true;
        } catch (e) {
          console.error("[EmailJS] init failed:", e);
          return false;
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        supabaseSmokeTest();
        initEmailJS();
      });

      /* ========= Helpers ========= */
      function escapeHtml(s) {
        if (s == null) return "";
        return String(s)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      //  randomUUID fallback for older browsers
      function uuid() {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        const b = new Uint8Array(16);
        (window.crypto || window.msCrypto).getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
          12,
          16
        )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }

      // Default date = today
      document.addEventListener("DOMContentLoaded", () => {
        const d = document.getElementById("date");
        if (d && !d.value) {
          const today = new Date();
          d.value = today.toISOString().slice(0, 10);
        }
      });

      /* ========= Freshdesk preview hook ========= */
      document
        .getElementById("btn-load-ticket")
        ?.addEventListener("click", () => {
          const id = document.getElementById("ticket-number").value.trim();
          const pane = document.getElementById("ticket-view");
          const body = document.getElementById("ticket-content");
          if (!id) {
            alert("Enter ticket number");
            return;
          }
          pane.style.display = "block";
          body.innerHTML = `<div class="hint">Preview for ticket <strong>${escapeHtml(
            id
          )}</strong> (connect your Freshdesk proxy to load real data).</div>`;
        });

      /* ========= Y/N/NA & SCORING ========= */
      function recomputeAutoFail() {
        let failing = false;
        document.querySelectorAll(".item.critical").forEach((item) => {
          const noSel = !!item.querySelector(".btn.no.selected");
          if (noSel) failing = true;
        });
       state.autoFailed = failing;
document.getElementById("autofail-message").style.display = state.autoFailed
          ? "block"
          : "none";
      }

      function updateSectionScore(sectionName) {
        let sectionTotal = 0,
          sectionMaximum = 0;
        document
          .querySelectorAll('.item[data-section="' + sectionName + '"]')
          .forEach((item) => {
            const yesBtn = item.querySelector(".btn.yes");
            const w = parseInt(yesBtn?.getAttribute("data-weight")) || 0;
            const isNA = !!item.querySelector(".btn.na.selected");
            const isYes = !!item.querySelector(".btn.yes.selected");
            sectionMaximum += w;
          if (isYes || isNA) {
             sectionTotal += w;
           }
          });
        const el = document.querySelector(
          '.section-score[data-section="' + sectionName + '"]'
        );
        if (!el) return;
        if (sectionName === "critical") {
          const answeredBtns = document.querySelectorAll(
            '.item[data-section="critical"] .btn.yes.selected, .item[data-section="critical"] .btn.no.selected'
          ).length;
          const totalItems = document.querySelectorAll(
            '.item[data-section="critical"]'
          ).length;
          const allAnswered = answeredBtns === totalItems;

         if (!allAnswered) {
  el.textContent = "Not Started";
  el.style.color = "";
} else if (state.autoFailed) {
  el.textContent = "FAILED";
  el.style.color = "#ef4444";
} else {
  el.textContent = "PASSED";
  el.style.color = "#22c55e";
}
        } else {
          el.textContent = sectionTotal + "/" + sectionMaximum;
          el.style.color = "";
        }
      }

      function updateAllSectionScores() {
        document.querySelectorAll(".section").forEach((sec) => {
          const name = sec.getAttribute("data-section");
          updateSectionScore(name);
        });
      }

      function validateNoComments() {
        let missing = 0;
        document.querySelectorAll(".item").forEach((item) => {
          const isNo = !!item.querySelector(".btn.no.selected");
          const ta = item.querySelector(".comments");
          const cwrap = item.querySelector(".cwrap");
          if (isNo) {
            if (cwrap) cwrap.classList.add("show");
            if (ta) {
              if (!ta.value.trim()) {
                missing++;
                ta.classList.add("required");
                item.classList.add("error");
              } else {
                ta.classList.remove("required");
                item.classList.remove("error");
              }
            }
          } else {
            if (ta) ta.classList.remove("required");
            item.classList.remove("error");
          }
        });
        return missing;
      }

      function unansweredCount() {
        const total = document.querySelectorAll(".item").length;
        let count = 0;
        document.querySelectorAll(".item").forEach((i) => {
          if (i.querySelector(".btn.selected")) count++;
        });
        return total - count;
      }
      function totalNoCount() {
        return document.querySelectorAll(".btn.no.selected").length;
      }

      function computeMaxTotal() {
        let max = 0;
        document.querySelectorAll(".item").forEach((item) => {
          const w =
            parseInt(
              item.querySelector(".btn.yes")?.getAttribute("data-weight")
            ) || 0;
          const isNASelected = !!item.querySelector(".btn.na.selected");
          if (!isNASelected) {
            max += w;
          }
        });
        return max;
      }

      function updateSubmitState() {
        const missing = validateNoComments();
        const unanswered = unansweredCount();
        const noCount = totalNoCount();
        document.getElementById("chip-unanswered").textContent =
          "Unanswered: " + unanswered;
        document.getElementById("chip-missing-comments").textContent =
          '"No" w/o comment: ' + missing;
        document.getElementById("chip-no-count").textContent =
          'Total "No": ' + noCount;
        document.getElementById("submit-evaluation").disabled =
          unanswered > 0 || missing > 0;
      }

      function updateCurrentScore() {
        const maxTotal = computeMaxTotal();
        document.getElementById("max-score").textContent = String(
          maxTotal || 100
        );

        if (state.autoFailed) {
          document.getElementById("current-score").textContent = "0";
          const pf = document.getElementById("pass-fail-indicator");
          pf.textContent = "FAIL";
          pf.className = "pf fail";
          updateAllSectionScores();
          updateSubmitState();
          return;
        }
        let totalScore = 0;
        document.querySelectorAll(".item").forEach((item) => {
          const yesBtn = item.querySelector(".btn.yes");
          const w = parseInt(yesBtn?.getAttribute("data-weight")) || 0;
          const isNA = !!item.querySelector(".btn.na.selected");
          const isYes = !!item.querySelector(".btn.yes.selected");
          if (isNA || isYes) {
            totalScore += w;
          }
        });
        document.getElementById("current-score").textContent = totalScore;
        const pf = document.getElementById("pass-fail-indicator");
        if (totalScore >= 80) {
          pf.textContent = "PASS";
          pf.className = "pf pass";
        } else {
          pf.textContent = "FAIL";
          pf.className = "pf fail";
        }
        updateAllSectionScores();
        updateSubmitState();
      }

      function onChoice(btn) {
        const item = btn.closest(".item");
        item
          .querySelectorAll(".btn.yes,.btn.no,.btn.na")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        const cwrap = item.querySelector(".cwrap");
        if (cwrap) cwrap.classList.add("show");
        if (!btn.classList.contains("no")) {
          const ta = item.querySelector(".comments");
          if (ta) ta.classList.remove("required");
          item.classList.remove("error");
        }
        recomputeAutoFail();
        updateCurrentScore();
      }

      //  Single, valid delegated click handler (all actions inside)
      document.addEventListener("click", (e) => {
        const t = e.target;

        if (t.matches(".btn.yes, .btn.no, .btn.na")) {
          onChoice(t);
          return;
        }

        if (t.matches(".tab")) {
          document
            .querySelectorAll(".tab")
            .forEach((x) => x.classList.remove("active"));
          t.classList.add("active");

          const tn = t.getAttribute("data-tab");
          document
            .querySelectorAll(".tab-content")
            .forEach((c) => (c.style.display = "none"));
          document.getElementById(tn + "-tab").style.display = "block";

          if (tn === "list") displayEvaluations();
          if (tn === "dashboard") updateDashboard();
          if (tn === "agents") displayAgents();
          if (tn === "disputes") displayDisputes();
          if (tn === "settings") loadNotificationSettings();
          return;
        }

        const sh = t.closest(".section-h");
        if (sh) {
          sh.parentElement
            .querySelector(".section-c")
            ?.classList.toggle("collapsed");
          return;
        }

        if (t.matches(".view-details")) {
          const id = t.getAttribute("data-id");
          const ev = state.evaluations.find((x) => x.id === id);
          if (!ev) return;

          let msg = "Agent: " + ev.agentName + "\n";
          msg += "Date: " + new Date(ev.date).toLocaleDateString() + "\n";
          msg +=
            "Overall Score: " +
            (ev.autoFailed
              ? "0/100 (AUTO-FAIL)"
              : ev.overallScore + "/100 " + (ev.passed ? "(PASS)" : "(FAIL)")) +
            "\n\n";

          msg += "Results by Section:\n";

          for (const key in ev.sections) {
            const s = ev.sections[key];
            if (key === "critical") {
              msg +=
                "\n" +
                s.name +
                ": " +
                (ev.autoFailed ? "FAILED" : "PASSED") +
                "\n";
            } else {
              msg +=
                "\n" +
                s.name +
                ": " +
                s.score +
                "/" +
                s.maximum +
                " (" +
                s.percentage.toFixed(1) +
                "%)\n";
            }

            (s.criteria || []).forEach((c) => {
              const r = c.isNA ? "N/A" : c.passed ? "PASS" : "FAIL";
              const critical = c.isCritical ? " [CRITICAL]" : "";
              msg +=
                "- " +
                c.name +
                " (" +
                c.weight +
                " points): " +
                r +
                critical +
                "\n";
              if (c.comments) msg += "  Comments: " + c.comments + "\n";
            });
          }

          alert(msg);
          return;
        }

        if (t.matches(".notify-about-evaluation")) {
          const id = t.getAttribute("data-id");
          const ev = state.evaluations.find((x) => x.id === id);
          if (ev) sendNotificationEmail(ev);
          return;
        }

        if (t.matches(".dispute-eval")) {
          state.disputeEvalId = t.getAttribute("data-id");

          const ev = state.evaluations.find((x) => x.id === state.disputeEvalId);
          if (!ev) return;

          populateDisputeCriteria(ev);
          document.getElementById("dispute-reason").value = "";
          document
            .getElementById("eval-dispute-backdrop")
            .classList.add("open");
          return;
        }

        if (t.matches(".delete-evaluation")) {
          const id = t.getAttribute("data-id");
          if (!confirm("Delete this evaluation?")) return;
          removeEvaluation(id);
          return;
        }

        if (t.matches("#btn-open-dispute")) {
          document.getElementById("dispute-backdrop").classList.add("open");
          return;
        }
        if (t.matches("#close-dispute")) {
          document.getElementById("dispute-backdrop").classList.remove("open");
          return;
        }

        if (t.matches("#btn-mark-calibration")) {
          document.getElementById("cal-backdrop").classList.add("open");
          document.getElementById("cal-reviewers").value =
            state.pendingCalibration.join(", ");
          return;
        }
        if (t.matches("#cal-cancel")) {
          document.getElementById("cal-backdrop").classList.remove("open");
          return;
        }
        if (t.matches("#cal-save")) {
          const v = document.getElementById("cal-reviewers").value.trim();
          state.pendingCalibration = v
            ? v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
          document.getElementById("cal-backdrop").classList.remove("open");
          alert(
            "This evaluation will be flagged for calibration when you submit."
          );
          return;
        }

        if (t.matches(".resolve-dispute")) {
          const id = t.getAttribute("data-id");
          const outcome = t.getAttribute("data-outcome");
          const note = prompt(`Add a note (${outcome})`);
          if (!note) return;
          resolveDispute(id, outcome, note);
          return;
        }
      });

      document
        .querySelectorAll(".comments")
        .forEach((el) => el.addEventListener("input", updateSubmitState));

      document
        .getElementById("btn-next")
        .addEventListener("click", function () {
          const items = [...document.querySelectorAll(".item")];
          const target = items.find((i) => !i.querySelector(".btn.selected"));
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });

      // ===== FORM SUBMIT =====
      document
        .getElementById("evaluation-form")
        .addEventListener("submit", async function (e) {
          e.preventDefault();
          const unanswered = unansweredCount();
          const missing = validateNoComments();
          if (unanswered > 0 || missing > 0) {
            alert("Please resolve before submitting.");
            return;
          }

          const selectedAgentId = document.getElementById("agent-select").value;
          const ag = state.agents.find(
            (a) => String(a.id) === String(selectedAgentId)
          );
          const agentName = ag ? ag.name : "";
          const ticketNumber = document
            .getElementById("ticket-number")
            .value.trim();
          const channel = document.getElementById("channel").value;
          const date = document.getElementById("date").value;
          const overallComments =
            document.getElementById("overall-comments").value;

          const criteriaScores = [];
          document.querySelectorAll(".item").forEach((item) => {
            const qText =
              item.querySelector(".q")?.childNodes[0]?.textContent?.trim() ||
              "";
            const yes = !!item.querySelector(".btn.yes.selected");
            const na = !!item.querySelector(".btn.na.selected");
            const yesBtn = item.querySelector(".btn.yes");
            const w = parseInt(yesBtn?.getAttribute("data-weight")) || 0;
            const comments = item.querySelector(".comments")?.value || "";
            const isCritical = item.classList.contains("critical");
            const sectionName = item.getAttribute("data-section");
            criteriaScores.push({
              name: qText,
              weight: w,
              passed: yes,
              isNA: na,
              isCritical,
              comments,
              section: sectionName,
            });
          });

          const sections = {};
          document.querySelectorAll(".section").forEach((s) => {
            const key = s.getAttribute("data-section");
            const title = s.querySelector(".section-title")
              ? s.querySelector(".section-title").textContent
              : key;
            sections[key] = {
              name: title,
              criteria: [],
              score: 0,
              maximum: 0,
              percentage: 0,
            };
          });
          criteriaScores.forEach((c) => {
            if (sections[c.section]) sections[c.section].criteria.push(c);
          });
          for (const k in sections) {
            let st = 0,
              sm = 0;
            (sections[k].criteria || []).forEach((c) => {
              sm += c.weight;

              if (c.passed || c.isNA) {
              st += c.weight;
             }
            });
            sections[k].score = st;
            sections[k].maximum = sm;
            sections[k].percentage = sm > 0 ? (st / sm) * 100 : 0;
          }

          let total = 0;
          if (!state.autoFailed) {
            criteriaScores.forEach((c) => {
              if (c.passed || c.isNA) total += c.weight;
            });
          }
          const evaluation = {
            id: uuid(),
            agentName,
            agentId: selectedAgentId,
            ticketNumber,
            channel,
            date,
            criteriaScores,
            sections,
            overallScore: state.autoFailed ? 0 : total,
            autoFailed: state.autoFailed,
            passed: !state.autoFailed && total >= 80,
            overallComments,
            timestamp: new Date().toISOString(),
            calibration: state.pendingCalibration.length
              ? { reviewers: state.pendingCalibration, status: "requested" }
              : null,
            dispute: null,
          };

          await createEvaluation(evaluation);

          // Reset
          this.reset();
          document
            .querySelectorAll(".btn.yes,.btn.no,.btn.na")
            .forEach((b) => b.classList.remove("selected"));
          document
            .querySelectorAll(".cwrap")
            .forEach((w) => w.classList.remove("show"));
          document.querySelectorAll(".comments").forEach((t) => {
            t.classList.remove("required");
            t.value = "";
          });
          document
            .querySelectorAll(".item")
            .forEach((i) => i.classList.remove("error"));
          document.querySelectorAll(".section-score").forEach((span) => {
            const nm = span.getAttribute("data-section");
            if (nm === "critical") {
              span.textContent = "Not Started";
              span.style.color = "";
            } else {
              const items = document.querySelectorAll(
                '.item[data-section="' + nm + '"]'
              );
              let max = 0;
              items.forEach((i) => {
                max +=
                  parseInt(
                    i.querySelector(".btn.yes")?.getAttribute("data-weight")
                  ) || 0;
              });
              span.textContent = "0/" + max;
            }
          });
          document.getElementById("current-score").textContent = "0";
          document.getElementById("max-score").textContent = String(
            computeMaxTotal() || 100
          );
          const pf = document.getElementById("pass-fail-indicator");
          pf.textContent = "FAIL";
          pf.className = "pf fail";
          document.getElementById("autofail-message").style.display = "none";
          state.autoFailed = false;
          state.pendingCalibration = [];
          document.getElementById("chip-unanswered").textContent =
            "Unanswered: 0";
          document.getElementById("chip-missing-comments").textContent =
            '"No" w/o comment: 0';
          document.getElementById("chip-no-count").textContent =
            'Total "No": 0';
          document.getElementById("submit-evaluation").disabled = true;

          alert("Evaluation submitted successfully!");
          displayEvaluations();
          updateDashboard();

          // send notification (async, safe)
          sendNotificationEmail(evaluation);

          document.querySelector('.tab[data-tab="list"]').click();
        });

      /* ========= LIST / DISPUTES ========= */
      function displayEvaluations() {
        const list = document.getElementById("evaluations-list");
        const empty = document.getElementById("no-evaluations");
        list.innerHTML = "";
        if (state.evaluations.length === 0) {
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        state.evaluations
          .slice()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .forEach((ev) => {
            const card = document.createElement("div");
            card.className = "card";
            const pf = ev.passed
              ? '<span class="pf pass">PASS</span>'
              : '<span class="pf fail">FAIL</span>';
            const auto = ev.autoFailed
              ? '<span class="badge crit">Auto-Failed</span>'
              : "";
            const cal = ev.calibration
              ? '<span class="badge">Calibration: ' +
                escapeHtml(ev.calibration.status || "") +
                "</span>"
              : "";
            const dis = ev.dispute
              ? '<span class="badge" style="background:#fff7ed;border-color:#fed7aa">Dispute: ' +
                escapeHtml(ev.dispute.status || "") +
                "</span>"
              : "";
            card.innerHTML =
              '<div class="card-b">' +
              '<h4 style="margin:0 0 4px 0">' +
              escapeHtml(ev.agentName) +
              " - " +
              new Date(ev.date).toLocaleDateString() +
              "</h4>" +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0">' +
              pf +
              ' <span class="badge">Score: ' +
              ev.overallScore +
              "/100</span>" +
              '<span class="badge">Channel: ' +
              escapeHtml(getChannelName(ev.channel)) +
              "</span> " +
              auto +
              " " +
              cal +
              " " +
              dis +
              "</div>" +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
              '<button class="ghost view-details" data-id="' +
              ev.id +
              '">View Details</button>' +
              '<button class="ghost notify-about-evaluation" data-id="' +
              ev.id +
              '">Send Notification</button>' +
              '<button class="ghost dispute-eval" data-id="' +
              ev.id +
              '">Dispute</button>' +
              '<button class="ghost delete-evaluation" style="background:#fff1f1;border-color:#ffd1d1" data-id="' +
              ev.id +
              '">Delete</button>' +
              "</div>" +
              "</div>";
            list.appendChild(card);
          });
      }

      function populateDisputeCriteria(ev) {
        const wrap = document.getElementById("dispute-criteria-list");
        wrap.innerHTML = "";

        ev.criteriaScores
          .filter((c) => !c.passed && !c.isNA)
          .forEach((c) => {
            const row = document.createElement("label");
            row.className = "checkbox-mini";
            row.innerHTML = `
          <input type="checkbox"
                 value="${escapeHtml(c.name)}"
                 data-weight="${c.weight}">
          ${escapeHtml(c.name)} (${c.weight} pts)
        `;
            wrap.appendChild(row);
          });
      }

      document
        .getElementById("cancel-eval-dispute")
        .addEventListener("click", function () {
          document
            .getElementById("eval-dispute-backdrop")
            .classList.remove("open");
          state.disputeEvalId = null;
        });

      document
        .getElementById("save-eval-dispute")
        .addEventListener("click", async function () {
          const reason = document.getElementById("dispute-reason").value.trim();
          if (!reason) {
            alert("Please add a reason.");
            return;
          }

          const selected = [
            ...document.querySelectorAll(
              "#dispute-criteria-list input:checked"
            ),
          ].map((i) => ({
            name: i.value,
            weight: Number(i.dataset.weight),
          }));

          if (!selected.length) {
            alert("Select at least one question");
            return;
          }

          const ev = state.evaluations.find((e) => e.id === state.disputeEvalId);
          if (!ev) return;

          const dispute = {
            status: "open",
            reason,
            disputed_criteria: selected,
            resolution: null,
          };

          try {
            const { error } = await sb
              .from("evaluations")
              .update({ dispute })
              .eq("id", state.disputeEvalId);

            if (error) throw error;

            ev.dispute = dispute;

            document
              .getElementById("eval-dispute-backdrop")
              .classList.remove("open");
            displayEvaluations();
            updateDisputeBadge();
            toast("Dispute submitted");
          } catch (err) {
            console.error("[dispute] update failed:", err);
            alert("Failed to submit dispute: " + (err?.message || err));
          }
        });

      function updateDisputeBadge() {
        const open = state.evaluations.filter(
          (e) => e.dispute && e.dispute.status !== "resolved"
        ).length;
        const badge = document.getElementById("dispute-badge");
        if (!badge) return;
        badge.textContent = open;
        badge.style.display = open ? "inline-block" : "none";
      }

      function displayDisputes() {
        const list = document.getElementById("disputes-list");
        const empty = document.getElementById("no-disputes");
        list.innerHTML = "";

        const disputes = state.evaluations.filter((e) => e.dispute);

        if (!disputes.length) {
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";

        disputes.forEach((ev) => {
          const card = document.createElement("div");
          card.className = "card";

          card.innerHTML = `
        <div class="card-b">
          <strong>${escapeHtml(ev.agentName)}</strong>
          <div class="hint">${new Date(
            ev.date
          ).toLocaleDateString()} • ${getChannelName(ev.channel)}</div>

          <p style="margin:8px 0"><strong>Reason:</strong> ${escapeHtml(
            ev.dispute.reason
          )}</p>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="ghost view-details" data-id="${
              ev.id
            }">View Evaluation</button>
            <button class="ghost resolve-dispute" data-id="${
              ev.id
            }" data-outcome="accepted">Accept</button>
            <button class="ghost resolve-dispute" data-id="${
              ev.id
            }" data-outcome="rejected">Reject</button>
          </div>
        </div>
      `;
          list.appendChild(card);
        });
      }

      /* ========= DASHBOARD ========= */
      function updateDashboard() {
        const total = state.evaluations.length;
        document.getElementById("kpi-evals").textContent = total;

        const passedCount = state.evaluations.filter((e) => e.passed).length;
        const passRate = total ? (passedCount / total) * 100 : 0;
        document.getElementById("pass-rate").textContent =
          passRate.toFixed(1) + "%";
        document.getElementById("pass-count").textContent = passedCount;
        document
          .getElementById("donut-pass")
          .style.setProperty("--p", (passRate * 3.6).toFixed(1) + "deg");

        const avg = total
          ? state.evaluations.reduce((s, e) => s + (Number(e.overallScore) || 0), 0) /
            total
          : 0;
        document.getElementById("avg-score").textContent = avg.toFixed(1) + "%";
        document
          .getElementById("donut-avg")
          .style.setProperty("--p", (avg * 3.6).toFixed(1) + "deg");

        const autoCount = state.evaluations.filter((e) => e.autoFailed).length;
        const autoRate = total ? (autoCount / total) * 100 : 0;
        document.getElementById("auto-rate").textContent =
          autoRate.toFixed(1) + "%";
        document.getElementById("auto-count").textContent = autoCount;
        document
          .getElementById("donut-auto")
          .style.setProperty("--p", (autoRate * 3.6).toFixed(1) + "deg");

        const recent = document.getElementById("recent-evaluations");
        recent.innerHTML = "";
        const rows = [...state.evaluations]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        if (rows.length === 0) {
          recent.innerHTML = '<p class="smallnote">No evaluations yet.</p>';
        } else {
          rows.forEach((ev) => {
            const badge = ev.passed
              ? '<span class="pf pass" style="font-size:12px;padding:2px 6px">PASS</span>'
              : '<span class="pf fail" style="font-size:12px;padding:2px 6px">FAIL</span>';
            const line = document.createElement("div");
            line.innerHTML =
              '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">' +
              "<div><strong>" +
              escapeHtml(ev.agentName || "") +
              '</strong><div class="smallnote">' +
              new Date(ev.date).toLocaleDateString() +
              "</div></div>" +
              '<div style="text-align:right"><div style="font-weight:900">' +
              (ev.overallScore || 0) +
              "/100</div>" +
              badge +
              "</div>" +
              "</div>";
            recent.appendChild(line);
          });
        }

        const tbody = document.getElementById("line-items");
        tbody.innerHTML = "";

        if (total === 0) {
          tbody.innerHTML =
            '<tr><td colspan="3" class="smallnote">No data yet.</td></tr>';
          return;
        }

        const stat = {};
        state.evaluations.forEach((ev) => {
          (ev.criteriaScores || []).forEach((c) => {
            if (c.isNA) return;
            const name = c.name || "Unknown";
            if (!stat[name]) stat[name] = { pass: 0, count: 0 };
            stat[name].count += 1;
            if (c.passed) stat[name].pass += 1;
          });
        });

        const rowsData = Object.keys(stat)
          .map((name) => {
            const s = stat[name];
            const rate = s.count ? (s.pass / s.count) * 100 : 0;
            return { name, count: s.count, rate };
          })
          .sort((a, b) => a.rate - b.rate)
          .slice(0, 6);

        rowsData.forEach((r) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" +
            escapeHtml(r.name) +
            "</td>" +
            "<td>" +
            r.count +
            "</td>" +
            "<td>" +
            r.rate.toFixed(1) +
            "%</td>";
          tbody.appendChild(tr);
        });
      }

/* ===== SIMPLE PERFORMANCE INSIGHT ===== */

const insightEl = document.getElementById("performance-summary-text");

if (!insightEl) {
  console.warn("performance-summary-text element not found");
} else if (state.evaluations.length > 1) {
  const agentTotals = {};

  state.evaluations.forEach((ev) => {
    if (!agentTotals[ev.agentName]) {
      agentTotals[ev.agentName] = { total: 0, count: 0 };
    }
    agentTotals[ev.agentName].total += ev.overallScore;
    agentTotals[ev.agentName].count += 1;
  });

  const averages = Object.entries(agentTotals).map(([name, data]) => ({
    name,
    avg: data.total / data.count,
  }));

  averages.sort((a, b) => b.avg - a.avg);

  const top = averages[0];
  const low = averages[averages.length - 1];

  insightEl.textContent =
    `Top performer: ${top.name} (${top.avg.toFixed(1)}%) | ` +
    `Lowest performer: ${low.name} (${low.avg.toFixed(1)}%)`;
} else if (insightEl) {
  insightEl.textContent =
    "Not enough data to determine performance spread.";
}

      /* ========= EXPORT CSV ========= */
      document
        .getElementById("export-csv")
        .addEventListener("click", function () {
         if (state.evaluations.length === 0) {
            alert("No evaluations to export.");
            return;
          }
          let csv =
            "Agent Name,Date,Channel,Ticket Number,Overall Score,Pass/Fail,Auto-Failed,Overall Comments\n";
          state.evaluations.forEach((ev) => {
            const escaped = ev.overallComments
              ? '"' + ev.overallComments.replace(/"/g, '""') + '"'
              : "";
            csv +=
              [
                '"' + (ev.agentName || "").replace(/"/g, '""') + '"',
                new Date(ev.date).toLocaleDateString(),
                getChannelName(ev.channel),
                '"' + String(ev.ticketNumber || "").replace(/"/g, '""') + '"',
                ev.overallScore,
                ev.passed ? "PASS" : "FAIL",
                ev.autoFailed ? "YES" : "NO",
                escaped,
              ].join(",") + "\n";
          });
          const blob = new Blob([csv], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.setAttribute("hidden", "");
          a.href = url;
          a.download = "qms_evaluations.csv";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });

      /* ========= EMAIL NOTIFICATIONS ========= */
      function loadNotificationSettings() {
        document.getElementById("team-lead-email").value =
          state.notificationSettings.teamLeadEmail || "";
        document.getElementById("notify-agents").checked =
          !!state.notificationSettings.notifyAgents;
      }

      document
        .getElementById("save-notification-settings")
        .addEventListener("click", function () {
          state.notificationSettings.teamLeadEmail =
            document.getElementById("team-lead-email").value;
          state.notificationSettings.notifyAgents =
            document.getElementById("notify-agents").checked;
          localStorage.setItem(
            "qms_notification_settings",
            JSON.stringify(state.notificationSettings)
          );
          alert("Notification settings saved!");
        });

      async function sendEmail(to, templateId, evaluation, htmlBody) {
        if (!window.emailjs) throw new Error("EmailJS not loaded");

        return emailjs.send("service_iirmd95", templateId, {
          to_email: to,
          agent_name: evaluation.agentName,
          message: htmlBody,
        });
      }

      function buildEmailBody(evaluation, criteriaResults) {
  return `
    <html>
      <body style="font-family:Arial,sans-serif;background:#f6f7fb;padding:20px">
        <div style="max-width:600px;margin:auto;background:white;border-radius:10px;padding:20px">
          <h2 style="margin:0;color:#1f2937">📊 QA Evaluation Update</h2>

          <p style="font-size:16px">Hi ${escapeHtml(evaluation.agentName)},</p>

          <div style="background:#eef2ff;padding:12px;border-radius:8px;margin:15px 0">
            <strong>Score:</strong> ${evaluation.overallScore}/100
            <span style="font-weight:bold">
              ${evaluation.passed ? "✅ PASS" : "⚠ Needs Attention"}
            </span>
          </div>

          <p>
            📅 <strong>Date:</strong> ${new Date(evaluation.date).toLocaleDateString()}<br>
            📡 <strong>Channel:</strong> ${escapeHtml(getChannelName(evaluation.channel))}
          </p>

          ${
            evaluation.autoFailed
              ? `
                <div style="background:#fff3cd;padding:12px;border-radius:8px;margin:15px 0">
                  ⚠ <strong>Auto-Fail Triggered</strong><br>
                  A critical process gap was detected. Focus coaching on verification and decision discipline.
                </div>
              `
              : ""
          }

          <h3 style="color:#374151">🧠 Coaching Notes</h3>
          <p>${escapeHtml(evaluation.overallComments || "No additional coaching notes provided.")}</p>

          <h3 style="color:#374151">📋 Evaluation Breakdown</h3>
          <pre style="background:#f9fafb;padding:10px;border-radius:6px;font-size:13px;white-space:pre-wrap">${escapeHtml(criteriaResults)}</pre>

          <p style="margin-top:20px">
            This evaluation is designed to support consistency and strengthen decision-making — not just scoring.
          </p>

          <p style="margin-top:20px;color:#6b7280">QA Performance System</p>
        </div>
      </body>
    </html>
  `;
}

      async function sendNotificationEmail(evaluation) {
        const teamLeadEmail = (state.notificationSettings.teamLeadEmail || "").trim();

        if (!teamLeadEmail) {
          if (confirm("No team lead email configured. Set it now?")) {
            document.querySelector('.tab[data-tab="settings"]').click();
            document.getElementById("team-lead-email").focus();
          }
          return;
        }

        let agentEmail = "";
        if (state.notificationSettings.notifyAgents) {
          const ag = state.agents.find(
            (a) => String(a.id) === String(evaluation.agentId)
          );
          if (ag?.email) agentEmail = ag.email.trim();
        }

        let criteriaResults = "";
        for (const key in evaluation.sections) {
          const section = evaluation.sections[key];
          if (key === "critical") {
            criteriaResults +=
              "\n" +
              section.name +
              ": " +
              (evaluation.autoFailed ? "FAILED" : "PASSED") +
              "\n";
          } else {
            criteriaResults +=
              "\n" +
              section.name +
              ": " +
              section.score +
              "/" +
              section.maximum +
              " (" +
              section.percentage.toFixed(1) +
              "%)\n";
          }
          (section.criteria || []).forEach((c) => {
            const result = c.isNA ? "N/A" : c.passed ? "PASS" : "FAIL";
            const critical = c.isCritical ? " [CRITICAL]" : "";
            criteriaResults +=
              "- " +
              c.name +
              " (" +
              c.weight +
              " points): " +
              result +
              critical +
              "\n";
            if (c.comments) {
              criteriaResults += "  Comments: " + c.comments + "\n";
            }
          });
        }

        const bodyHtml = buildEmailBody(evaluation, criteriaResults);

        try {
          await sendEmail(
            teamLeadEmail,
            "template_9kv84df",
            evaluation,
            bodyHtml
          );
          console.log("[EmailJS] Team lead email sent");
        } catch (err) {
          console.error("[EmailJS] Team lead send failed:", err);
          alert(
            "Email to team lead failed: " + (err?.text || err?.message || err)
          );
        }

        if (agentEmail) {
          try {
            await sendEmail(
              agentEmail,
              "template_9kv84df",
              evaluation,
              bodyHtml
            );
            console.log("[EmailJS] Agent email sent");
          } catch (err) {
            console.error("[EmailJS] Agent send failed:", err);
            alert(
              "Email to agent failed: " + (err?.text || err?.message || err)
            );
          }
        }
      }

      function getChannelName(channel) {
        const map = { call: "Phone Call", chat: "Live Chat", email: "Email" };
        return map[channel] || channel;
      }

      // Agents + Evaluations (Supabase)
      async function fetchAgents() {
        try {
          const { data, error } = await sb
            .from("agents")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw error;
          state.agents = data || [];
          displayAgents();
          updateAgentDropdown();
        } catch (err) {
          console.error("[agents] fetchAgents error:", err);
          alert("Failed to load agents: " + (err?.message || err));
        }
      }

      async function createAgent({ name, email, team, position }) {
        try {
          const { data, error } = await sb
            .from("agents")
            .insert([{ name, email, team, position }])
            .select()
            .single();
          if (error) throw error;
          state.agents.unshift(data);
          displayAgents();
          updateAgentDropdown();
          toast("Agent added");
          return data;
        } catch (err) {
          console.error("[agents] createAgent error:", err);
          alert("Add agent failed: " + (err?.message || err));
          throw err;
        }
      }

      async function removeAgent(id) {
        try {
          const { error } = await sb.from("agents").delete().eq("id", id);
          if (error) throw error;
          state.agents = state.agents.filter((a) => a.id !== id);
          displayAgents();
          updateAgentDropdown();
          toast("Agent deleted");
        } catch (err) {
          console.error("[agents] removeAgent error:", err);
          alert("Delete failed: " + (err?.message || err));
        }
      }

      function displayAgents() {
        const list = document.getElementById("agents-list");
        const empty = document.getElementById("no-agents");
        list.innerHTML = "";
        if (!state.agents.length) {
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        state.agents.forEach((a) => {
          const item = document.createElement("div");
          item.className = "card";
          item.innerHTML =
            '<div class="card-b" style="display:flex;justify-content:space-between;align-items:center">' +
            '<div><div style="font-weight:800">' +
            escapeHtml(a.name || "") +
            "</div>" +
            '<div class="hint">' +
            escapeHtml(a.position || "") +
            " - " +
            escapeHtml(a.team || "") +
            "</div>" +
            '<div class="hint">' +
            escapeHtml(a.email || "") +
            "</div></div>" +
            '<button class="ghost delete-agent" data-id="' +
            a.id +
            '">Delete</button>' +
            "</div>";
          item
            .querySelector(".delete-agent")
            .addEventListener("click", () => removeAgent(a.id));
          list.appendChild(item);
        });
      }

      function evalDbToUi(r) {
        const csRaw = r.criteria_scores;
        const criteriaScores = Array.isArray(csRaw)
          ? csRaw
          : csRaw && typeof csRaw === "object"
          ? Object.values(csRaw)
          : [];
        const sections =
          r.sections && typeof r.sections === "object" ? r.sections : {};
        return {
          id: r.id,
          agentId: r.agent_id || null,
          agentName: r.agent_name || "",
          ticketNumber: r.ticket_number || "",
          channel: r.channel,
          date: r.date,
          criteriaScores,
          sections,
          overallScore: r.overall_score ?? 0,
          autoFailed: !!r.auto_failed,
          passed: !!r.passed,
          overallComments: r.overall_comments || "",
          timestamp: r.created_at,
          calibration: r.calibration || null,
          dispute: r.dispute || null,
        };
      }

     function evalUiToDb(e) {
  return {
    id: e.id,
    agent_id: e.agentId || null,
    agent_name: e.agentName || "",
    ticket_number: e.ticketNumber,
    channel: e.channel,
    date: e.date,
    criteria_scores: e.criteriaScores,
    sections: e.sections,
    overall_score: e.overallScore,
    auto_failed: e.autoFailed,
    passed: e.passed,
    overall_comments: e.overallComments,
    calibration: e.calibration,
    dispute: e.dispute,
    payload: e, // ✅ REQUIRED for NOT NULL column
  };
}

      async function fetchEvaluations() {
        try {
          const { data, error } = await sb
            .from("evaluations")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw error;
          state.evaluations = (data || []).map(evalDbToUi);
          updateDisputeBadge();
          displayEvaluations();
          updateDashboard();
        } catch (err) {
          console.error("[evaluations] fetch error:", err);
          alert("Failed to load evaluations: " + (err?.message || err));
        }
      }

      async function createEvaluation(evaluationUi) {
        try {
          const payload = evalUiToDb(evaluationUi);
          const { data, error } = await sb
            .from("evaluations")
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          state.evaluations.unshift(evalDbToUi(data));
          displayEvaluations();
          updateDashboard();
        } catch (err) {
          console.error("[evaluations] create error (local fallback):", err);
          state.evaluations.unshift({
            ...evaluationUi,
            timestamp: new Date().toISOString(),
          });
          displayEvaluations();
          updateDashboard();
          toast("Server save failed; saved locally for now.");
        }
      }

      async function removeEvaluation(id) {
        try {
          const { error } = await sb.from("evaluations").delete().eq("id", id);
          if (error) throw error;
          state.evaluations = state.evaluations.filter((e) => e.id !== id);
          displayEvaluations();
          updateDashboard();
        } catch (err) {
          console.error("[evaluations] delete error:", err);
          alert("Delete evaluation failed: " + (err?.message || err));
        }
      }

      async function resolveDispute(id, outcome, note) {
        const ev = state.evaluations.find((e) => e.id === id);
        if (!ev || !ev.dispute) return;

        let restored = 0;

        if (outcome === "accepted") {
          ev.dispute.disputed_criteria.forEach((c) => {
            restored += c.weight;
          });

          ev.overallScore = Math.min(100, ev.overallScore + restored);
          ev.passed = ev.overallScore >= 80;
        }

        ev.dispute.status = "resolved";
        ev.dispute.resolution = {
          outcome,
          points_restored: restored,
          note,
          resolved_by: "QA Lead",
          resolved_at: new Date().toISOString(),
        };

        try {
          const { error } = await sb
            .from("evaluations")
            .update({
              dispute: ev.dispute,
              overall_score: ev.overallScore,
              passed: ev.passed,
            })
            .eq("id", id);

          if (error) throw error;

          displayDisputes();
          displayEvaluations();
          updateDisputeBadge();
          updateDashboard();
          toast(`Dispute ${outcome}`);
        } catch (err) {
          console.error("[resolveDispute] failed:", err);
          alert("Failed to resolve dispute: " + (err?.message || err));
        }
      }

      function updateAgentDropdown() {
        const sel = document.getElementById("agent-select");
        if (!sel) return;
        sel.innerHTML = '<option value="">Select an Agent</option>';
        state.agents.forEach((a) => {
          const opt = document.createElement("option");
          opt.value = a.id;
          opt.textContent = a.name;
          sel.appendChild(opt);
        });
      }

      function toast(msg) {
        const t = document.createElement("div");
        t.textContent = msg;
        t.style.position = "fixed";
        t.style.bottom = "20px";
        t.style.right = "20px";
        t.style.padding = "10px 14px";
        t.style.border = "1px solid var(--border)";
        t.style.background = "#fff";
        t.style.borderRadius = "12px";
        t.style.boxShadow = "var(--shadow)";
        t.style.fontWeight = "800";
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 1400);
      }

      /* ========= MODAL SAFETY & UX ========= */
      function closeAllModals() {
        document
          .querySelectorAll(".backdrop.open")
          .forEach((b) => b.classList.remove("open"));
      }

      document.addEventListener("DOMContentLoaded", () => {
        closeAllModals();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAllModals();
      });
      document.querySelectorAll(".backdrop").forEach((b) => {
        b.addEventListener("click", (e) => {
          if (e.target === b) b.classList.remove("open");
        });
      });

      // ===== AGENT FORM SUBMIT =====
      document
        .getElementById("agent-form")
        ?.addEventListener("submit", async (e) => {
          e.preventDefault();

          const name = document.getElementById("new-agent-name")?.value.trim();
          const email = document
            .getElementById("new-agent-email")
            ?.value.trim();
          const team = document.getElementById("new-agent-team")?.value.trim();
          const position = document
            .getElementById("new-agent-position")
            ?.value.trim();

          if (!name || !email || !team || !position) {
            alert("Please fill in all agent fields.");
            return;
          }

          try {
            await createAgent({ name, email, team, position });
            e.target.reset();
          } catch (err) {
            // createAgent already alerts
          }
        });

      /* ========= INIT ========= */
      document.addEventListener("DOMContentLoaded", () => {
  updateAgentDropdown();
  displayAgents();
  updateDashboard();
  loadNotificationSettings();
  updateCurrentScore();
  fetchAgents();
  fetchEvaluations();
});

document.addEventListener("DOMContentLoaded", () => {
  const dashboardTab = document.querySelector('.tab[data-tab="dashboard"]');
  if (dashboardTab) {
    dashboardTab.click();
  }
});
