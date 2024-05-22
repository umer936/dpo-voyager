import { customElement, html, LitElement, property } from "lit-element";
import { Color } from "three";

@customElement("sv-property-labeled-color")
export class PropertyLabeledColor extends LitElement {
    @property({ type: Object }) property: any;
    @property({ type: Object }) language: any;

    @property({ type: String }) label: string = "";
    @property({ type: String }) colorValue: string = "#ffffff"; // Default color value

    protected onColorChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const newColor = new Color(input.value);
        const colorArray = newColor.toArray();
        this.colorValue = input.value;
        this.property.setValue(colorArray);
        this.dispatchEvent(new CustomEvent('color-change', { detail: { color: colorArray } }));
    }

    protected onLabelChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.label = input.value;
        this.dispatchEvent(new CustomEvent('label-change', { detail: { label: this.label } }));
    }

    protected render() {
        return html`
            <div class="property-labeled-color">
                <label for="color-input">Annotation Color:</label>
                <input id="color-input" type="color" @change=${this.onColorChange} .value=${this.colorValue}>
                <label for="text-input">Annotation Label:</label>
                <input id="text-input" type="text" @input=${this.onLabelChange} placeholder="Enter annotation label" .value=${this.label}>
            </div>
        `;
    }
}
