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

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import "./DocumentList";
import "./NodeTree";

import CVTaskProvider from "../../components/CVTaskProvider";
import CVDocumentProvider from "client/components/CVDocumentProvider";
import CVPolyline from "client/components/CVPolyline";

import NVNode from "client/nodes/NVNode";
import CVMeta from "client/components/CVMeta";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-navigator-panel")
export default class NavigatorPanel extends SystemView {
    private _firstPolyline: boolean = true;

    protected get taskProvider() {
        return this.system.getMainComponent(CVTaskProvider);
    }

    protected firstConnected() {
        this.classList.add("sv-panel", "sv-navigator-panel");

        window.addEventListener("polyline-added", (event: CustomEvent) => {
            const label = event.detail.label;
            console.log("New polyline added with label:", label);
            this.handlePolylineAdd(label);
        });
    }

    protected connected() {
        this.taskProvider.ins.mode.on("value", this.performUpdate, this);
    }

    protected disconnected() {
        this.taskProvider.ins.mode.off("value", this.performUpdate, this);
    }


    protected handlePolylineAdd(label: String) {
        const activeDoc = this.system.getMainComponent(CVDocumentProvider).activeComponent;
        if (this._firstPolyline == true) {
            let node = activeDoc.innerGraph.createCustomNode(NVNode);
            let parent = activeDoc.root;
            node.name = "Polylines";
            parent.transform.addChild(node.transform);
            this._firstPolyline = false;
        }
        if (!activeDoc.system.findNodeByName(label.toString(), NVNode)) {
            let parentNode = activeDoc.innerGraph.createCustomNode(NVNode);
            let parent = activeDoc.system.findNodeByName("Polylines") as NVNode;
            parentNode.name = label.toString();
            parent.transform.addChild(parentNode.transform);
        }
        let node = activeDoc.innerGraph.createCustomNode(NVNode);
        node.createComponent(CVPolyline);
        let parent = activeDoc.system.findNodeByName(label.toString()) as NVNode;
        node.name = "Polyline #";
        parent.transform.addChild(node.transform);
    }

    protected render() {
        const system = this.system;
        const expertMode = this.taskProvider.expertMode;

        const documentList = expertMode ? html`<div class="ff-splitter-section ff-flex-column" style="flex-basis: 30%">
            <div class="sv-panel-header">
                <ff-icon name="document"></ff-icon>
                <div class="ff-text">Documents</div>
            </div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y">
                <sv-document-list .system=${system}></sv-document-list>
            </div></div>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>` : null;

        return html`${documentList}
            <div class="ff-splitter-section ff-flex-column" style="flex-basis: 70%">
                <div class="sv-panel-header">
                    <ff-icon name="hierarchy"></ff-icon>
                    <div class="ff-text" style="flex-grow:1">Nodes</div>
                </div>
                <sv-node-tree class="ff-flex-item-stretch" .system=${system}></sv-node-tree>
            </div>`;
    }
}