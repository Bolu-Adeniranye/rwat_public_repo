/* expects attributes:
   type = 'circle' | 'square' | 'triangle' 
   colour = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' 
   
   public methods:
   flip()
   isFaceDown()
   getUniqueRandomCardsAsHTML (static)

   (see examples below and in the HTML file)
   */

export class ShapeCard extends HTMLElement {
    static observedAttributes = ["type", "colour"];

    static HEIGHT = '100px';
    static WIDTH = '100px';
    static BORDER = '1px';

    static SHAPE_DATA = { circle: { tag: 'circle' }, square: { tag: 'rect' }, triangle: { tag: 'polygon' } };
    static get SHAPES() {
        return Object.keys(ShapeCard.SHAPE_DATA);
    }
    static shapeTag(type) {
        return ShapeCard.SHAPE_DATA[type].tag;
    }
    static COLOURS = ['red', 'green', 'blue', 'yellow', 'orange', 'purple'];

    static COMBINATIONS = ShapeCard.SHAPES.map(s => ShapeCard.COLOURS.map(c => [s, c])).flat();

    static getUniqueRandomCardsAsHTML(count, duplicate) {
        if (count > this.COMBINATIONS.length) {
            throw new Error(`Cannot get ${count} unique shape cards. Maximum is ${this.COMBINATIONS.length}.`);
        }

        return ShapeCard.COMBINATIONS.
            // shuffle COMBINATIONS 
            reduce((acc, val) => {
                return acc.toSpliced(Math.floor(Math.random() * (acc.length + 1)), 0, val);
            }, []).
            // take only first rows * cols / 2 combinations
            slice(0, count).
            // create two of each card
            reduce((acc, val) => {
                for (let i = 0; i < (duplicate ? 2 : 1); ++i) {
                    acc.splice(Math.floor(Math.random() * (acc.length + 1)), 0, val);
                }
                return acc;
            }, []).
            // map to shape-card elements and join together
            map(([type, colour]) => `<shape-card type="${type}" colour="${colour}"></shape-card>`).join('');
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.appendChild(document.getElementById('shape-card-template').content.cloneNode(true));

        this.#setShape(null, this.getAttribute('type'));
        this.#setColour(this.getAttribute('colour'));

        this.style.setProperty("--card-width", ShapeCard.WIDTH);
        this.style.setProperty("--card-height", ShapeCard.HEIGHT);
        this.style.setProperty("--card-border", ShapeCard.BORDER);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (this.shadowRoot) {
            if (name == 'type') {
                this.#setShape(oldVal, newVal);
            } else if (name == 'colour') {
                this.#setColour(newVal);
            }
        }
    }

    #setShape(oldVal, newVal) {
        if (newVal && !(newVal in ShapeCard.SHAPE_DATA)) {
            throw new Error(`Invalid shape type attribute ${newType}. Expected one of ${ShapeCard.SHAPES.join(', ')}.`);
        }
        // make the old shape invisible and the new shape visible
        oldVal && this.shadowRoot.querySelector(ShapeCard.shapeTag(oldVal))?.setAttribute('fill-opacity', '0');
        newVal && this.shadowRoot.querySelector(ShapeCard.shapeTag(newVal))?.setAttribute('fill-opacity', '1');
    }

    #setColour(newVal) {
        if (newVal && !ShapeCard.COLOURS.includes(newVal)) {
            throw new Error(`Invalid colour attribute ${newVal}. Expected one of ${ShapeCard.COLOURS.join(', ')}.`);
        }
        // change the colour of the shape
        newVal && this.shadowRoot.querySelector(ShapeCard.shapeTag(this.getAttribute("type")))?.setAttribute('fill', newVal);
    }

    isFaceUp() {
        const card = this.shadowRoot.querySelector('.card');
        return card.classList.contains('card-face-up');
    }

    flip() {
        const card = this.shadowRoot.querySelector('.card');
        card.classList.toggle('card-face-down');
        card.classList.toggle('card-face-up');
    }
}
customElements.define('shape-card', ShapeCard);
