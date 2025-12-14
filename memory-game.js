// memory-game.js
import { ShapeCard } from "./shapecard.js";
import { saveGameResult, getAverageClicks } from "./firebase.js";

class MemoryGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Game state
    this.first = null;
    this.second = null;
    this.lock = false;
    this.matches = 0;
    this.clicks = 0;
    this.totalPairs = 0;
    this.gameWon = false;

    // UI refs
    this.clickCountEl = null;
    this.avgResultEl = null;
    this.statusEl = null;
  }

  connectedCallback() {
    this.newGame();
  }

  // Accepts size="3x4" or size="3 x 4"
  parseSize() {
    const raw = (this.getAttribute("size") || "3x4").toLowerCase();
    const parts = raw.split("x");
    if (parts.length !== 2) return null;

    const rows = Number(parts[0].trim());
    const cols = Number(parts[1].trim());

    if (!Number.isInteger(rows) || !Number.isInteger(cols)) return null;
    if (rows <= 0 || cols <= 0) return null;
    if ((rows * cols) % 2 !== 0) return null;

    return { rows, cols };
  }

  newGame() {
    const size = this.parseSize();
    if (!size) {
      this.shadowRoot.innerHTML = `
        <p style="font-family:sans-serif;padding:1rem;">
          Invalid size attribute. Use e.g. size="3x4" or size="3 x 4" with an even number of cards.
        </p>
      `;
      return;
    }

    const { rows, cols } = size;
    this.totalPairs = (rows * cols) / 2;

    // Reset state
    this.first = null;
    this.second = null;
    this.lock = false;
    this.matches = 0;
    this.clicks = 0;
    this.gameWon = false;

    // Generate cards (already paired + shuffled by starter helper)
    const cardsHTML = ShapeCard.getUniqueRandomCardsAsHTML(this.totalPairs, true);

    // Build UI
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 900px;
          margin: 2rem auto;
        }

        .app {
          background: var(--panel-bg, rgba(255,255,255,0.7));
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }

        .topbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .title {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .title h1 {
          font-size: 1.1rem;
          margin: 0;
          letter-spacing: 0.2px;
        }

        .status {
          font-size: 0.95rem;
          opacity: 0.8;
          margin: 0;
        }

        .stats {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .pill {
          padding: 0.4rem 0.7rem;
          border-radius: 999px;
          background: rgba(0,0,0,0.05);
          font-size: 0.95rem;
        }

        button {
          appearance: none;
          border: 1px solid rgba(0,0,0,0.12);
          background: white;
          border-radius: 10px;
          padding: 0.55rem 0.8rem;
          cursor: pointer;
          font-weight: 600;
        }

        button:hover { transform: translateY(-1px); }
        button:active { transform: translateY(0px); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }

        .board {
          display: grid;
          gap: 10px;
          justify-content: center;
          grid-template-columns: repeat(${cols}, auto);
          padding: 0.5rem 0.25rem 0.25rem;
        }

        .below {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .avg {
          margin: 0;
          font-size: 0.95rem;
          opacity: 0.85;
        }
      </style>

      <div class="app">
        <div class="topbar">
          <div class="title">
            <h1>Memory Game</h1>
            <p class="status" id="status">Find all matching pairs.</p>
          </div>

          <div class="stats">
            <span class="pill">Clicks: <strong id="click-count">0</strong></span>
            <button id="new-game-btn" type="button">New game</button>
            <button id="avg-btn" type="button">Show average clicks</button>
          </div>
        </div>

        <div class="board" id="board">
          ${cardsHTML}
        </div>

        <div class="below">
          <p class="avg" id="avg-result"></p>
        </div>
      </div>
    `;

    // Cache UI refs
    this.clickCountEl = this.shadowRoot.querySelector("#click-count");
    this.avgResultEl = this.shadowRoot.querySelector("#avg-result");
    this.statusEl = this.shadowRoot.querySelector("#status");

    // Button handlers
    this.shadowRoot.querySelector("#new-game-btn")
      .addEventListener("click", () => this.newGame());

    this.shadowRoot.querySelector("#avg-btn")
      .addEventListener("click", () => this.showAverage());

    // Card handlers
    this.shadowRoot.querySelectorAll("shape-card")
      .forEach(card => card.addEventListener("click", () => this.handleCard(card)));

    // Reset display
    this.updateStatus("Find all matching pairs.");
    this.setAverageText("");
    this.updateClicks(0);
  }

  updateClicks(val) {
    if (this.clickCountEl) this.clickCountEl.textContent = String(val);
  }

  updateStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  setAverageText(text) {
    if (this.avgResultEl) this.avgResultEl.textContent = text;
  }

  handleCard(card) {
    if (this.gameWon) return;                // ✅ win lock
    if (this.lock) return;
    if (card.isFaceUp()) return;

    // Count clicks
    this.clicks++;
    this.updateClicks(this.clicks);

    // Flip
    card.flip();

    // First selection
    if (!this.first) {
      this.first = card;
      return;
    }

    // Second selection
    this.second = card;
    this.checkMatch();
  }

  async checkMatch() {
    const sameType = this.first.getAttribute("type") === this.second.getAttribute("type");
    const sameColour = this.first.getAttribute("colour") === this.second.getAttribute("colour");

    if (sameType && sameColour) {
      // Match
      this.matches++;
      this.first = null;
      this.second = null;

      const remaining = this.totalPairs - this.matches;
      this.updateStatus(remaining === 0 ? "Completed!" : `Nice! ${remaining} pair(s) left.`);

      if (this.matches === this.totalPairs) {
        // ✅ win lock and save once
        this.gameWon = true;
        this.updateStatus(`You won in ${this.clicks} clicks! Saving result…`);

        try {
          await saveGameResult(this.clicks);
          this.updateStatus(`You won in ${this.clicks} clicks! Result saved.`);
        } catch (err) {
          console.error("Failed to save game result:", err);
          this.updateStatus(`You won in ${this.clicks} clicks! (Could not save result)`);
        }
      }
      return;
    }

    // No match → flip back after delay
    this.lock = true;
    this.updateStatus("No match — try again.");

    setTimeout(() => {
      this.first.flip();
      this.second.flip();
      this.first = null;
      this.second = null;
      this.lock = false;
      this.updateStatus("Find all matching pairs.");
    }, 800);
  }

  async showAverage() {
    this.setAverageText("Loading average…");

    try {
      // We'll compute average + count by reusing Firestore reads.
      // If you want count too, update firebase.js to also return count.
      // For now, simplest approach: call getAverageClicks() and show it.
      const avg = await getAverageClicks();

      if (avg == null) {
        this.setAverageText("No games recorded yet.");
      } else {
        this.setAverageText(`Average clicks to win: ${avg.toFixed(2)}`);
      }
    } catch (err) {
      console.error("Error getting average clicks:", err);
      this.setAverageText("Error loading average (check console / Firestore rules).");
    }
  }
}

customElements.define("memory-game", MemoryGame);
