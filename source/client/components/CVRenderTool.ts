/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "../ui/PropertyOptions";
import "../ui/PropertyColor";

import CVDocument from "./CVDocument";
import CVViewer from "./CVViewer";

import CVTool, { customElement, html, ToolView } from "./CVTool";
import { EShaderMode } from "client/schema/setup";

import { property } from "@ff/ui/CustomElement";

export type ColorChangeListener = (index: number, color: string) => void;

////////////////////////////////////////////////////////////////////////////////

export default class CVRenderTool extends CVTool
{
    static readonly typeName: string = "CVRenderTool";

    static readonly text = "Material";
    static readonly icon = "palette";

    createView()
    {
        return new RenderToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-render-tool-view")
export class RenderToolView extends ToolView<CVRenderTool>
{
    protected viewer: CVViewer = null;
    @property({ type: Boolean }) showDipColors = false;
    @property({ type: Boolean }) showDipDirColors = false;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-render-tool-view");
    }

    protected render()
    {
        const tool = this.tool;
        const document = this.activeDocument;

        const viewer = this.viewer;
        if (!viewer) {
            return html``;
        }

        const shader = viewer.ins.shader;
        const language = document.setup.language;

        const dipColorLabels = ["0 degrees", "30 degrees", "60 degrees", "90 degrees"];
        const dipColors = [
            this.vectorToRGBA(viewer.ins.customDipColor1.value),
            this.vectorToRGBA(viewer.ins.customDipColor2.value),
            this.vectorToRGBA(viewer.ins.customDipColor3.value),
            this.vectorToRGBA(viewer.ins.customDipColor4.value),
        ];
        const dipColorPickerPanel = this.showDipColors ? html`
            <div class="sv-section">
                <ff-button class="sv-section-lead" transparent tabbingIndex="-1" icon="cog"></ff-button>
                <div class="sv-tool-controls">
                    ${this.renderDipColorLegend(dipColors)}
                    ${dipColorLabels.map((label, index) => html`
                        <div class="color-picker-item">
                            <label>${label}</label>
                            <div class="color-picker-wrapper">
                                <sv-property-color .property=${viewer.ins[`customDipColor${index + 1}`]} .hideLabel=${true} @color-change=${(event: CustomEvent) => this.onDipColorChange(index + 1, event)}></sv-property-color>
                            </div>
                        </div>
                    `)}
                </div>
            </div>
        ` : '';

        const dipDirColorLabels = ["0 (360) degrees", "90 degrees", "180 degrees", "270 degrees"];
        const dipDirColors = [
            this.vectorToRGBA(viewer.ins.customDipDirColor1.value),
            this.vectorToRGBA(viewer.ins.customDipDirColor2.value),
            this.vectorToRGBA(viewer.ins.customDipDirColor3.value),
            this.vectorToRGBA(viewer.ins.customDipDirColor4.value),
        ];
        const dipDirColorPickerPanel = this.showDipDirColors ? html`
            <div class="sv-section">
                <ff-button class="sv-section-lead" transparent tabbingIndex="-1" icon="cog"></ff-button>
                <div class="sv-tool-controls">
                    ${this.renderDipDirColorLegend(dipDirColors)}
                    ${dipDirColorLabels.map((label, index) => html`
                        <div class="color-picker-item">
                            <label>${label}</label>
                            <div class="color-picker-wrapper">
                                <sv-property-color .property=${viewer.ins[`customDipDirColor${index + 1}`]} .hideLabel=${true} @color-change=${(event: CustomEvent) => this.onDipDirColorChange(index + 1, event)}></sv-property-color>
                            </div>
                        </div>
                    `)}
                </div>
            </div>
        ` : '';

        return html`
            ${dipColorPickerPanel}
            ${dipDirColorPickerPanel}
            <div class="sv-section">
                <ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
                <div class="sv-tool-controls">
                    <sv-property-options .property=${shader} .language=${language} name=${language.getLocalizedString("Material")}></sv-property-options>
                </div>
            </div>
        `;
    }

    protected vectorToRGBA(vector: number[]): string {
        if (!vector || (vector.length !== 3 && vector.length !== 4)) {
            console.error("Invalid vector format:", vector);
            return "rgba(0, 0, 0, 1)"; // Fallback color in case of invalid vector
        }
        const [r, g, b, a = 1] = vector; // Default alpha to 1 if not provided
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }

    protected onDipColorChange(index: number, event: CustomEvent) {
        const color = event.detail.color;
        this.viewer.setCustomDipColor(index, color); // Pass color to CVViewer
        this.requestUpdate();
    }

    protected onDipDirColorChange(index: number, event: CustomEvent) {
        const color = event.detail.color;
        this.viewer.setCustomDipDirectionColor(index, color); // Pass color to CVViewer
        this.requestUpdate();
    }

    // Define a property to hold the callback
    protected colorChangeListener: ColorChangeListener = null;

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (this.viewer) {
            this.viewer.ins.shader.off("value", this.onUpdate, this);
            this.viewer = null;
        }

        if (next) {
            this.viewer = next.setup.viewer;
            this.viewer.ins.shader.on("value", this.onUpdate, this);
            this.checkDipMode();
        }
    }

    protected checkDipMode() {
        const shaderMode = this.viewer.ins.shader.value;
        this.showDipColors = shaderMode === EShaderMode.Dip;
        this.showDipDirColors = shaderMode === EShaderMode.DipDirection;
        this.requestUpdate();
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("sv-property-options")[0] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }

    protected onUpdate() {
        this.checkDipMode();
    }

    protected renderDipColorLegend(colors: string[]) {
        const gradient = `linear-gradient(to right, ${colors.join(", ")})`;
        return html`
            <div class="color-legend">
                <div class="color-legend-title">Dip Color Legend (0 to 90 degrees)</div>
                <div class="color-legend-gradient" style="background: ${gradient};"></div>
                <div class="color-legend-labels">
                    <span>0</span>
                    <span>30</span>
                    <span>60</span>
                    <span>90</span>
                </div>
            </div>
        `;
    }

    protected renderDipDirColorLegend(colors: string[]) {
        const gradient = `linear-gradient(to right, ${colors.concat(colors[0]).join(", ")})`;
        return html`
            <div class="color-legend">
                <div class="color-legend-title">Dip Direction Color Legend (0 to 360 degrees)</div>
                <div class="color-legend-gradient" style="background: ${gradient};"></div>
                <div class="color-legend-labels">
                    <span>0</span>
                    <span>90</span>
                    <span>180</span>
                    <span>270</span>
                    <span>360</span>
                </div>
            </div>
        `;
    }
}
