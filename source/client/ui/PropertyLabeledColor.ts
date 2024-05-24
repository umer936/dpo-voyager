import { customElement, html, LitElement, property } from "lit-element";
import { Color } from "three";

interface Annotation {
    color: string;
    label: string;
}

interface ColorLabelMap {
    [color: string]: string;
}

@customElement("sv-property-labeled-color")
export class PropertyLabeledColor extends LitElement {
    @property({ type: Object }) property: any;
    @property({ type: Object }) language: any;

    @property({ type: String }) selectedColor: string = "#ffffff"; // Default color value
    @property({ type: String }) selectedLabel: string = ""; // Default label value
    @property({ type: Array }) annotations: Annotation[] = []; // Array to store annotations
    @property({ type: Boolean }) addingAnnotation: boolean = false; // Flag to indicate whether user is adding annotation
    @property({ type: Object }) colorLabelMap: ColorLabelMap = {}; // Mapping between colors and labels

    protected onColorChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedColor = input.value;

        if (this.colorLabelMap[this.selectedColor]) {
            this.selectedLabel = this.colorLabelMap[this.selectedColor];
            this.addingAnnotation = false;
        } else {
            this.selectedLabel = "";
            this.addingAnnotation = false;
        }

        const newColor = new Color(input.value);
        const colorArray = newColor.toArray();
        this.property.setValue(colorArray);
        this.dispatchEvent(new CustomEvent('color-change', { detail: { color: colorArray } }));

        this.requestUpdate();
    }

    protected onLabelChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const selectedValue = select.value;
        if (selectedValue === "__add_annotation__") {
            this.addingAnnotation = true;
        } else {
            this.selectedLabel = selectedValue;
            this.addingAnnotation = false;
        }

        this.dispatchEvent(new CustomEvent('label-change', { detail: { label: this.selectedLabel } }));
        this.requestUpdate();
    }

    protected onCustomLabelChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedLabel = input.value;
    }

    protected addAnnotation() {
        if (!this.selectedLabel) return;

        const annotation: Annotation = {
            color: this.selectedColor,
            label: this.selectedLabel
        };
        this.annotations = [...this.annotations, annotation];
        this.colorLabelMap[this.selectedColor] = this.selectedLabel;
        this.addingAnnotation = false;

        this.requestUpdate();
    }

    protected render() {
        const colorHasLabel = !!this.colorLabelMap[this.selectedColor];
        return html`
            <div class="property-labeled-color">
                <label for="color-input">Annotation Color:</label>
                <input id="color-input" type="color" @change=${this.onColorChange} .value=${this.selectedColor}>
                ${!this.addingAnnotation ? html`
                    <label for="label-select">Annotation Label:</label>
                    <select id="label-select" @change=${this.onLabelChange} .value=${this.selectedLabel} ?disabled=${colorHasLabel}>
                        <option value="" selected disabled hidden>Select Label</option>
                        ${Object.entries(this.colorLabelMap).map(([color, label]) => html`
                            <option value="${label}" ?selected=${this.selectedLabel === label}>${label}</option>
                        `)}
                        <option value="__add_annotation__">Add Annotation...</option>
                    </select>
                ` : html`
                    <label for="custom-label-input">Custom Label:</label>
                    <input id="custom-label-input" type="text" @input=${this.onCustomLabelChange} placeholder="Enter custom label">
                    <button @click=${this.addAnnotation}>Add Annotation</button>
                `}
            </div>
        `;
    }
}
