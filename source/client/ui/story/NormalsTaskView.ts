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

import Node from "@ff/graph/Node";
import Component from "@ff/graph/Component";
import Property from "@ff/graph/Property";

import "@ff/scene/ui/PropertyView";

import { customElement, property, html } from "@ff/ui/CustomElement";
import Tree from "@ff/ui/Tree";

import CVNormalsTask from "../../components/CVNormalsTask";
import { TaskView } from "../../components/CVTask";
import NVNode from "../../nodes/NVNode";
import {EUnitType} from "client/schema/common";
import {EPoseManipMode} from "client/components/CVPoseTask";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-normals-task-view")
export default class NormalsTaskView extends TaskView<CVNormalsTask>
{
    protected render()
    {
        const node = this.activeNode;
        const model = node && node.model;
        if (!node) {
            return html`<div class="sv-placeholder">Please select a node to display its properties.</div>`;
        }

        /*return html`<div class="ff-flex-item-stretch ff-scroll-y">
            <sv-normals-tree .node=${node}></sv-normals-tree>
        </div>`;
        */

        const rotation = model.ins.rotation;

        console.log(model);
        console.log(model.ins);
        console.log(rotation);

        return html`
            <div class="ff-flex-item-stretch">
                <div class="ff-scroll-y ff-flex-column sv-detail-view">
                    <!--<div class="sv-label-right"></div>-->xxxxxxx
                    <sv-property-view .property=${rotation}></sv-property-view>
                </div>
            </div>`;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.requestUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

interface ITreeNode
{
    id: string;
    children: ITreeNode[];
    text: string;
    classes: string;
    property?: Property;
}

@customElement("sv-normals-tree")
export class NormalsTree extends Tree<ITreeNode>
{
    @property({ attribute: false })
    node: NVNode = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-property-tree", "sv-normals-tree");
    }

    protected getClasses(treeNode: ITreeNode)
    {
        return treeNode.classes;
    }

    protected update(changedProperties: Map<PropertyKey, unknown>)
    {
        if (changedProperties.has("node")) {
            this.root = this.createNodeTreeNode(this.node);
        }

        super.update(changedProperties);
    }

    protected renderNodeHeader(node: ITreeNode)
    {
        if (!node.property) {
            return html`<div class="ff-text ff-label ff-ellipsis">${node.text}</div>`;
        }

        return html`<sv-property-view .property=${node.property}></sv-property-view>`;

    }

    protected createNodeTreeNode(node: Node): ITreeNode
    {
        const components = node.components.getArray().filter(component => component["settingProperties"] && !component.tags.has("no_settings"));

        return {
            id: node.id,
            text: node.displayName,
            classes: "ff-node",
            children: components.map(component => ({
                id: component.id,
                text: component.displayName,
                classes: "ff-component",
                property: null,
                children: this.createPropertyNodes(component["settingProperties"]),
            })),
        };
    }

    protected createPropertyNodes(properties: Property[]): ITreeNode[]
    {
        const root: Partial<ITreeNode> = {
            children: []
        };

        properties.forEach(property => {
            const fragments = property.path.split(".");
            let node = root;

            const count = fragments.length;
            const last = count - 1;

            for (let i = 0; i < count; ++i) {
                const fragment = fragments[i];
                let child = node.children.find(node => node.text === fragment);

                if (!child) {
                    const id = i === last ? property.key : fragment;

                    child = {
                        id,
                        text: fragment,
                        classes: "",
                        children: [],
                        property: i === last ? property : null
                    };
                    node.children.push(child);
                }
                node = child;
            }
        });

        return root.children;
    }
}