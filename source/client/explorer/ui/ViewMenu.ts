/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import PropertyTracker from "@ff/graph/PropertyTracker";
import System from "@ff/graph/System";

import "@ff/ui/Grid";
import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

import COrbitNavigation, { EProjection, EViewPreset } from "../../core/components/COrbitNavigation";

import { customElement, html, property } from "@ff/ui/CustomElement";
import Popup from "@ff/ui/Popup";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-view-menu")
export default class ViewMenu extends Popup
{
    @property({ attribute: false })
    system: System;

    protected viewPreset: EViewPreset;
    protected propProjection: PropertyTracker<EProjection>;
    protected propPreset: PropertyTracker<EViewPreset>;

    constructor(system?: System)
    {
        super();

        this.system = system;
        this.viewPreset = EViewPreset.None;
        this.propProjection = new PropertyTracker(this.onPropertyChange, this);
        this.propPreset = new PropertyTracker(this.onPropertyChange, this);

        this.position = "anchor";
        this.align = "center";
        this.justify = "end";
        this.offsetX = 8;
        this.offsetY = 8;
        this.keepVisible = true;
    }

    protected connected()
    {
        super.connected();

        this.propProjection.property = this.system.components.get(COrbitNavigation).ins.projection;
        this.propPreset.property = this.system.components.get(COrbitNavigation).ins.preset;
        this.requestUpdate();

    }

    protected disconnected()
    {
        super.disconnected();

        this.propProjection.detach();
        this.propPreset.detach();
    }

    protected render()
    {
        const projection = this.propProjection.getValue();
        const preset = this.propPreset.getValue();

        return html`
            <label>Projection</label>
            <div class="ff-flex-row" @click=${this.onClickProjectionType}>
                <ff-button .index=${EProjection.Perspective} .selectedIndex=${projection}
                  text="Perspective" title="Perspective Projection" icon="video"></ff-button>    
                <ff-button .index=${EProjection.Orthographic} .selectedIndex=${projection}
                  text="Orthographic" title="Orthographic Projection" icon="video"></ff-button>    
            </div>
            <label>View</label>
            <ff-grid class="sv-cube" justifyContent="center" @click=${this.onClickViewPreset}>
                <ff-button .index=${EViewPreset.Top} .selectedIndex=${preset}
                  text="T" title="Top View" style="grid-column-start: 2; grid-row-start: 1;"></ff-button>
                <ff-button .index=${EViewPreset.Left} .selectedIndex=${preset}
                  text="L" title="Left View" style="grid-column-start: 1; grid-row-start: 2;"></ff-button>
                <ff-button .index=${EViewPreset.Front} .selectedIndex=${preset}
                  text="F" title="Front View" style="grid-column-start: 2; grid-row-start: 2;"></ff-button>
                <ff-button .index=${EViewPreset.Right} .selectedIndex=${preset}
                  text="R" title="Right View" style="grid-column-start: 3; grid-row-start: 2;"></ff-button>
                <ff-button .index=${EViewPreset.Back} .selectedIndex=${preset}
                  text="B" title="Back View" style="grid-column-start: 4; grid-row-start: 2;"></ff-button>
                <ff-button .index=${EViewPreset.Bottom} .selectedIndex=${preset}
                  text="B" title="Bottom View" style="grid-column-start: 2; grid-row-start: 3;"></ff-button>
            </ff-grid>
        `;
    }

    protected firstUpdated()
    {
        super.firstUpdated();

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        this.classList.add("sv-popup-menu");
    }

    protected onClickProjectionType(event: IButtonClickEvent)
    {
        this.propProjection.setValue(event.target.index);
        event.stopPropagation();
    }

    protected onClickViewPreset(event: IButtonClickEvent)
    {
        this.propPreset.setValue(event.target.index);
        event.stopPropagation();
    }

    protected onPropertyChange()
    {
        this.requestUpdate();
    }
}