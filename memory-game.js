// memory-game.js
import { ShapeCard } from "./shapecard.js";

class MemoryGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.first = null;
        this.second = null;
        this.lock = false;
        this.matches = 0;
    }

    connectedCallback() {
        this.startGame();
    }

    startGame() {
        const size = this.getAttribute("size");
        const [rows, cols] = size.split("x").map(Number);
        this.totalPairs = (rows * cols) / 2;

        const cardsHTML = ShapeCard.getUniqueRandomCardsAsHTML(this.totalPairs, true);

        const board = document.createElement("div");
        board.style.display = "grid";
        board.style.gridTemplateColumns = `repeat(${cols}, auto)`;
        board.style.gap = "10px";
        board.innerHTML = cardsHTML;

        this.shadowRoot.append(board);

        this.shadowRoot.querySelectorAll("shape-card")
            .forEach(card => card.addEventListener("click", () => this.handle(card)));
    }

    handle(card) {
        if (this.lock || card.isFaceUp()) return;

        card.flip();

        if (!this.first) {
            this.first = card;
            return;
        }

        this.second = card;
        this.compare();
    }

    compare() {
        const sameType = this.first.getAttribute("type") === this.second.getAttribute("type");
        const sameColour = this.first.getAttribute("colour") === this.second.getAttribute("colour");

        if (sameType && sameColour) {
            this.matches++;
            this.reset();

            if (this.matches === this.totalPairs) {
                alert("🎉 You win!");
            }
        } else {
            this.lock = true;
            setTimeout(() => {
                this.first.flip();
                this.second.flip();
                this.reset();
            }, 800);
        }
    }

    reset() {
        this.first = null;
        this.second = null;
        this.lock = false;
    }
}

customElements.define("memory-game", MemoryGame);
