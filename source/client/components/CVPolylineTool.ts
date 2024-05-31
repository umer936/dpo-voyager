import "../ui/PropertyBoolean";
import "../ui/PropertyString";
import "../ui/PropertyColor";
import "../ui/PropertyLabeledColor";

import CVDocument from "./CVDocument";
import { EPolylineState } from "./CVPolyline";

import CVTool, { ToolView, customElement, html } from "./CVTool";
import { Color, LineBasicMaterial } from "three";

////////////////////////////////////////////////////////////////////////////////

export default class CVPolylineTool extends CVTool {
    static readonly typeName: string = "CVPolylineTool";

    static readonly text = "Annotate polyline";
    static readonly icon = "annotate";

    createView() {
        return new PolylineToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-polyline-tool-view")
export class PolylineToolView extends ToolView<CVPolylineTool> {
    protected firstRender: boolean = true;
    protected statusMsg: string = "";
    protected lines: any[] = [];

    protected firstConnected() {
        super.firstConnected();
        this.classList.add("sv-group", "sv-polyline-tool-view");
    }

    protected render() {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const tool = this.tool;
        const polyline = document.setup.polyline;
        const enabled = polyline.ins.enabled;
        const state = polyline.outs.state.value;
        const language = document.setup.language;
        let colorLabelMap = polyline.colorLabelMap;

        let text;

        if (!enabled.value) {
            text = language.getLocalizedString("Switch on to annotate polylines") + ".";
        } else if (state === EPolylineState.SetStart) {
            text = language.getLocalizedString("Choose an annotation type and then tap on model to set start of polyline") + ".";
        } else {
            text = language.getLocalizedString("Tap on model to set more points for this polyline or press the Enter key to end this polyline") + ".";
        }

        this.statusMsg = text;

        const colorPickerPanel = enabled.value ? html`
        <div class="sv-section">
            <div class="sv-tool-controls">
                <sv-property-labeled-color .property=${polyline.ins.color} .colorLabelMap=${colorLabelMap} @color-change=${this.onColorChanged} @label-change=${this.onLabelChange}></sv-property-labeled-color>
            </div>
        </div>
        ` : '';

        return html`
            ${colorPickerPanel}
            <div class="sv-section">
                <ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
                <div class="sv-tool-controls">
                    <sv-property-boolean .property=${enabled} .language=${language} name=${language.getLocalizedString("Polyline Tool")}></sv-property-boolean>
                    <div class="sv-property-view">
                        <div class="ff-string" aria-live="polite" aria-atomic="true"></div>
                    </div>
                </div>
            </div>
        `;
    }

    protected updated(changedProperties): void {
        super.updated(changedProperties);

        const container = this.getElementsByClassName("ff-string").item(0) as HTMLElement;
        if (container) {
            container.innerHTML = this.statusMsg;
            if (this.firstRender) {
                setTimeout(() => { container.innerHTML = `<div>${this.statusMsg}</div>` }, 200);
                this.firstRender = false;
            }
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument) {
        if (previous) {
            previous.setup.polyline.off("update", this.onUpdate, this);
        }
        if (next) {
            next.setup.polyline.on("update", this.onUpdate, this);
        }

        this.requestUpdate();
    }

    protected async setFocus() {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("ff-button")[1] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent) {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }

    protected onLabelChange(event: CustomEvent) {
        const { label } = event.detail;
        const document = this.activeDocument;
        if (document) {
            document.setup.polyline.ins.label.setValue(label);
        }
    }

    protected onColorChanged(event: CustomEvent) {
        const { color } = event.detail;
        const document = this.activeDocument;
        if (document) {
            const rgb = color.substring(1); // Remove the leading '#'
            const r = parseInt(rgb.substring(0, 2), 16) / 255;
            const g = parseInt(rgb.substring(2, 4), 16) / 255;
            const b = parseInt(rgb.substring(4, 6), 16) / 255;
            const newColor = new Color(r, g, b);
    
            document.setup.polyline.ins.color.value = newColor.toArray();
        }

        this.requestUpdate();
    }

    protected onUpdate = () => {
        this.requestUpdate();
    };
}
