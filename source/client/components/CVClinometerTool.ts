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

import "../ui/PropertyBoolean";
import "../ui/PropertyString";

import CVDocument from "./CVDocument";
import { EClinometerState } from "./CVClinometer";

import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVClinometerTool extends CVTool
{
    static readonly typeName: string = "CVClinometerTool";

    static readonly text = "Clinometer";
    static readonly icon = "info";

    createView()
    {
        return new ClinometerToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-clinometer-tool-view")
export class ClinometerToolView extends ToolView<CVClinometerTool>
{
    protected firstRender: boolean = true;
    protected statusMsg: string = "";

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-clinometer-tool-view");
    }

    protected render()
    {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const tool = this.tool;
        const clinometer = document.setup.clinometer;
        const enabled = clinometer.ins.enabled;
        const state = clinometer.outs.state.value;
        const radius = clinometer.outs.radius.value;
        const language = document.setup.language;

        let text;

        if (!enabled.value) {
            text = language.getLocalizedString("Switch on to take measurements") + ".";
        }
        else if (radius === 0) {
            text = language.getLocalizedString("Tap on model to set start of Clinometer") + ".";
        }
        else if (state === EClinometerState.SetStart) {
            const units = document.root.scene.ins.units.getOptionText();
            text = `${radius.toFixed(2)} ${units}`;
        }
        else {
            text = language.getLocalizedString("Tap on model to set end of Clinometer") + ".";
        }

        this.statusMsg = text;

        return html`<div class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <sv-property-boolean .property=${enabled} .language=${language} name=${language.getLocalizedString("Clinometer Tool")}></sv-property-boolean>
                <div class="sv-property-view"><label class="ff-label ff-off">${language.getLocalizedString("Measured Distance")}</label>
                <div class="ff-string" aria-live="polite" aria-atomic="true"></div></div>
            </div></div>`;
    }

    protected updated(changedProperties): void
    {
        super.updated(changedProperties);

        const container = this.getElementsByClassName("ff-string").item(0) as HTMLElement;
        if(container) {
            container.innerHTML = this.statusMsg;
            // Hack so that initial status message is detected by screen readers.
            if(this.firstRender) {
                setTimeout(() => {container.innerHTML = `<div>${this.statusMsg}</div>`}, 200);
                this.firstRender = false;
            }
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.clinometer.off("update", this.onUpdate, this);
        }
        if (next) {
            next.setup.clinometer.on("update", this.onUpdate, this);
        }

        this.requestUpdate();
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("ff-button")[1] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}
