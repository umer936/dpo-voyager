import { customElement, html, LitElement, property, css } from "lit-element";
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
    @property({ type: Boolean }) colorPickerClicked: boolean = true; // Flag to indicate whether the color picker has been clicked
    @property({ type: Boolean }) showColorError: boolean = false; // Flag to indicate whether to show the color error message
    @property({ type: Boolean }) showLabelError: boolean = false; // Flag to indicate whether to show the color error message

    static styles = css`
        .error-message {
            color: red;
            font-weight: bold;
            margin-top: 8px;
        }
    `;

    protected onColorChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedColor = input.value;

        const newColor = new Color(input.value);
        const colorArray = newColor.toArray();
        this.property.setValue(colorArray);

        // Check if the selected color is already associated with another label
        const associatedLabel = Object.entries(this.colorLabelMap).find(([_, color]) => color === this.selectedColor && this.selectedLabel !== _);
        if (associatedLabel) {
            const [label, _] = associatedLabel;
            alert(`Warning: The color you selected is already associated with the annotation type "${label}".`);
        }
    }

    protected onColorPickerClick() {
        // Set the colorPickerClicked flag to true when the color picker is clicked
        this.colorPickerClicked = true;
        this.showColorError = false;
    }

    protected onLabelChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const selectedValue = select.value;
        if (selectedValue === "__add_annotation__") {
            this.addingAnnotation = true;
        } else {
            this.selectedLabel = selectedValue;
            this.addingAnnotation = false;
            // Set the selected color based on the label
            this.selectedColor = this.colorLabelMap[selectedValue];
            this.dispatchEvent(new CustomEvent('label-change', { detail: { label: this.selectedLabel } }));
            this.dispatchEvent(new CustomEvent('color-change', { detail: { color: this.selectedColor } }));
        }

        this.requestUpdate();
    }

    protected onCustomLabelChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedLabel = input.value;
        this.showLabelError = false;
    }

    protected addAnnotation() {
        if (!this.colorPickerClicked) {
            // If no color is selected, prevent adding the annotation
            this.showColorError = true;
            return;
        }

        if (this.selectedLabel == "")
        {
            this.showLabelError = true;
           return; 
        }

        const annotation: Annotation = {
            color: this.selectedColor,
            label: this.selectedLabel
        };
        this.annotations = [...this.annotations, annotation];
        this.colorLabelMap[this.selectedLabel] = this.selectedColor;

        this.addingAnnotation = false;
        this.colorPickerClicked = false; // Reset the color selection status
        this.dispatchEvent(new CustomEvent('label-change', { detail: { label: this.selectedLabel } }));
        this.dispatchEvent(new CustomEvent('color-change', { detail: { color: this.selectedColor } }));
        this.requestUpdate();
    }

    protected goBack() {
        this.addingAnnotation = false;
        this.requestUpdate();
    }

    protected render() {
        const colorHasLabel = !!this.colorLabelMap[this.selectedColor];
        const colorErrorMessage = this.showColorError ? html`<div class="error-message">ERROR: Please select a color for the annotation.</div>` : html``;
        const labelErrorMessage = this.showLabelError ? html`<div class="error-message">ERROR: Please enter a label for the annotation.</div>` : html``;

        return html`
            <div class="property-labeled-color">
                ${this.addingAnnotation ? html`
                    <button @click=${this.goBack}>Back</button>
                    <label for="custom-label-input">Annotation Label:</label>
                    <input id="custom-label-input" type="text" @input=${this.onCustomLabelChange} placeholder="Enter annotation label">
                    <label for="color-input">Annotation Color:</label>
                    <input id="color-input" type="color" @click=${this.onColorPickerClick} @change=${this.onColorChange} .value=${this.selectedColor}>
                    <button @click=${this.addAnnotation}>Add Annotation</button>
                ` : html`
                    <label for="label-select">Choose annotation type:</label>
                    <select id="label-select" @change=${this.onLabelChange} .value=${this.selectedLabel}>
                        <option value="" selected disabled hidden>Select Label</option>
                        ${Object.entries(this.colorLabelMap).map(([label, color]) => html`
                            <option value="${label}" ?selected=${this.selectedLabel === label}>${label}</option>
                        `)}
                        <option value="__add_annotation__">Add Annotation...</option>
                    </select>
                `}
                ${colorErrorMessage}
                ${labelErrorMessage}
            </div>
        `;
    }
}
