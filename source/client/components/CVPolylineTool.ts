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
import { EPolylineState } from "./CVPolyline";

import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVPolylineTool extends CVTool
{
    static readonly typeName: string = "CVPolylineTool";

    static readonly text = "Annotate polyline";
    static readonly icon = "annotate";

    createView()
    {
        return new PolylineToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-polyline-tool-view")
export class PolylineToolView extends ToolView<CVPolylineTool>
{
    protected firstRender: boolean = true;
    protected statusMsg: string = "";

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-polyline-tool-view");
    }

    protected render()
    {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const tool = this.tool;
        const polyline = document.setup.polyline;
        const enabled = polyline.ins.enabled;
        const state = polyline.outs.state.value;
        const language = document.setup.language;

        let text;

        if (!enabled.value) {
            text = language.getLocalizedString("Switch on to annotate polylines") + ".";
        }
        else if (state === EPolylineState.SetStart) {
            text = language.getLocalizedString("Tap on model to set start of polyline") + ".";
        }
        else {
            text = language.getLocalizedString("Tap on model to set more points for this polyline or press the Enter key to end this polyline") + ".";
        }

        this.statusMsg = text;

        return html`<div class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <sv-property-boolean .property=${enabled} .language=${language} name=${language.getLocalizedString("Polyline Tool")}></sv-property-boolean>
                <div class="sv-property-view">
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
            previous.setup.tape.off("update", this.onUpdate, this);
        }
        if (next) {
            next.setup.tape.on("update", this.onUpdate, this);
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