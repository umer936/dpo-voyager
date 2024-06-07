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

import { ACESFilmicToneMapping, NoToneMapping, Mesh, Color, Vector3 } from "three";

import Component, { IComponentEvent, types } from "@ff/graph/Component";
import CRenderer from "@ff/scene/components/CRenderer";

import { EShaderMode, IViewer, TShaderMode } from "client/schema/setup";
import { EDerivativeQuality } from "client/schema/model";

import CVModel2, { IModelLoadEvent } from "./CVModel2";
import CVAnnotationView, { IAnnotationClickEvent, ITagUpdateEvent } from "./CVAnnotationView";
import CVAnalytics from "./CVAnalytics";
import CVLanguageManager from "./CVLanguageManager";
import CVARManager from "./CVARManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVViewer extends Component
{
    static readonly typeName: string = "CVViewer";

    static readonly text: string = "Viewer";
    static readonly icon: string = "";

    private _rootElement: HTMLElement = null;

    protected static readonly ins = {
        annotationsVisible: types.Boolean("Annotations.Visible"),
        activeAnnotation: types.String("Annotations.ActiveId"),
        activeTags: types.String("Tags.Active"),
        sortedTags: types.String("Tags.Sorted"),
        radioTags: types.Boolean("Tags.Radio"),
        shader: types.Enum("Renderer.Shader", EShaderMode),
        toneMapping: types.Boolean("Renderer.ToneMapping", false),
        exposure: types.Number("Renderer.Exposure", 1),
        gamma: types.Number("Renderer.Gamma", 2),
        quality: types.Enum("Models.Quality", EDerivativeQuality, EDerivativeQuality.High),
        isWallMountAR: types.Boolean("AR.IsWallMount", false),
        arScale: types.Number("AR.Scale", 1.0),
        customDipColor1: types.Vector3("Shader.CustomDipColor1", [0.533, 0.012, 0.0]),
        customDipColor2: types.Vector3("Shader.CustomDipColor2", [1.0, 0.267, 0.0]),
        customDipColor3: types.Vector3("Shader.CustomDipColor3", [1.0, 0.988, 0.0]),
        customDipColor4: types.Vector3("Shader.CustomDipColor3", [1.0, 1.0, 1.0]),
        customDipDirColor1: types.Vector3("Shader.CustomDipColor1", [1.0, 0.0, 0.0]),
        customDipDirColor2: types.Vector3("Shader.CustomDipColor2", [1.0, 1.0, 0.0]),
        customDipDirColor3: types.Vector3("Shader.CustomDipColor3", [0.0, 1.0, 0.0]),
        customDipDirColor4: types.Vector3("Shader.CustomDipColor3", [0.0, 0.0, 1.0]),
    };

    protected static readonly outs = {
        tagCloud: types.String("Tags.Cloud"),
    };

    ins = this.addInputs(CVViewer.ins);
    outs = this.addOutputs(CVViewer.outs);

    get settingProperties() {
        return [
            this.ins.annotationsVisible,
            this.ins.activeTags,
            this.ins.sortedTags,
            this.ins.radioTags,
            this.ins.shader,
            this.ins.toneMapping,
            this.ins.exposure,
            this.ins.gamma,
            this.ins.isWallMountAR,
            this.ins.arScale,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.annotationsVisible,
            this.ins.activeAnnotation,
            this.ins.activeTags,
            this.ins.shader,
            this.ins.exposure,
        ];
    }

    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }
    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get ar() {
        return this.getMainComponent(CVARManager);
    }

    get rootElement() {
        return this._rootElement;
    }
    set rootElement(root: HTMLElement) {
        this._rootElement = root;
    }

    create()
    {
        super.create();
        this.graph.components.on(CVModel2, this.onModelComponent, this);
        this.graph.components.on(CVAnnotationView, this.onAnnotationsComponent, this);
        this.graph.components.on(CVLanguageManager, this.onLanguageComponent, this);

        this.ar.ins.wallMount.linkFrom(this.ins.isWallMountAR);
        this.ar.ins.arScale.linkFrom(this.ins.arScale);
    }

    dispose()
    {
        this.graph.components.off(CVModel2, this.onModelComponent, this);
        this.graph.components.off(CVAnnotationView, this.onAnnotationsComponent, this);
        this.graph.components.off(CVLanguageManager, this.onLanguageComponent, this);
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.shader.changed) {
            const shader = ins.shader.getValidatedValue();
            this.getGraphComponents(CVModel2).forEach(model => model.ins.shader.setValue(shader));
        }
        if (ins.exposure.changed) {
            this.renderer.ins.exposure.setValue(ins.exposure.value);
        }
        if (ins.toneMapping.changed) {
            this.renderer.views.forEach(view => view.renderer.toneMapping = ins.toneMapping.value ? ACESFilmicToneMapping : NoToneMapping);

            const scene = this.renderer.activeScene;
            if (scene) {
                scene.traverse(object => {
                    const mesh = object as Mesh;
                    if (mesh.isMesh) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach(material => material.needsUpdate = true);
                        }
                        else {
                            mesh.material.needsUpdate = true;
                        }
                    }
                });
            }
        }
        if (ins.gamma.changed) {
            //this.renderer.ins.gamma.setValue(ins.gamma.value);
        }

        if (ins.quality.changed) {
            const quality = ins.quality.getValidatedValue();
            this.getGraphComponents(CVModel2).forEach(model => model.ins.quality.setValue(quality));
        }
        if (ins.activeAnnotation.changed) {
            const id = ins.activeAnnotation.value;
            this.getGraphComponents(CVAnnotationView).forEach(view => view.setActiveAnnotationById(id));
        }
        if (ins.annotationsVisible.changed) {
            const visible = ins.annotationsVisible.value;
            this.getGraphComponents(CVAnnotationView).forEach(view => view.ins.visible.setValue(visible));
        }
        if (ins.activeTags.changed) {
            const tags = ins.activeTags.value;
            this.getGraphComponents(CVAnnotationView).forEach(view => view.ins.activeTags.setValue(tags));
            this.getGraphComponents(CVModel2).forEach(model => model.ins.activeTags.setValue(tags));
        }
        if (ins.sortedTags.changed) {
            this.refreshTagCloud();
        }

        return true;
    }

    setCustomDipColor(index: number, color: { x: number, y: number, z: number }) {
        const vectorColor = this.vectorToVector3(color);
        switch (index) {
            case 1:
                this.ins.customDipColor1.setValue(vectorColor.toArray());
                break;
            case 2:
                this.ins.customDipColor2.setValue(vectorColor.toArray());
                break;
            case 3:
                this.ins.customDipColor3.setValue(vectorColor.toArray());
                break;
            case 4:
                this.ins.customDipColor4.setValue(vectorColor.toArray());
                break;
            default:
                break;
        }

        this.refreshDipColors();
    }

    setCustomDipDirectionColor(index: number, color: { x: number, y: number, z: number }) {
        const vectorColor = this.vectorToVector3(color);
        switch (index) {
            case 1:
                this.ins.customDipDirColor1.setValue(vectorColor.toArray());
                break;
            case 2:
                this.ins.customDipDirColor2.setValue(vectorColor.toArray());
                break;
            case 3:
                this.ins.customDipDirColor3.setValue(vectorColor.toArray());
                break;
            case 4:
                this.ins.customDipDirColor4.setValue(vectorColor.toArray());
                break;
            default:
                break;
        }

        this.refreshDipDirectionColors();
    }
    
    vectorToVector3(color: { x: number, y: number, z: number }): Vector3 {
        return new Vector3(color.x, color.y, color.z);
    }
    
    protected refreshDipColors() {
        const color1: Color = new Color().fromArray([
            this.ins.customDipColor1.value[0],
            this.ins.customDipColor1.value[1],
            this.ins.customDipColor1.value[2]
        ]);
        const color2: Color = new Color().fromArray([
            this.ins.customDipColor2.value[0],
            this.ins.customDipColor2.value[1],
            this.ins.customDipColor2.value[2]
        ]);
        const color3: Color = new Color().fromArray([
            this.ins.customDipColor3.value[0],
            this.ins.customDipColor3.value[1],
            this.ins.customDipColor3.value[2]
        ]);
        const color4: Color = new Color().fromArray([
            this.ins.customDipColor4.value[0],
            this.ins.customDipColor4.value[1],
            this.ins.customDipColor4.value[2]
        ]);
    
        const models = this.getGraphComponents(CVModel2);
        models.forEach(model => {
            model.setDipColors(color1, color2, color3, color4);
        });
    }

    protected refreshDipDirectionColors() {
        const color1: Color = new Color().fromArray([
            this.ins.customDipDirColor1.value[0],
            this.ins.customDipDirColor1.value[1],
            this.ins.customDipDirColor1.value[2]
        ]);
        const color2: Color = new Color().fromArray([
            this.ins.customDipDirColor2.value[0],
            this.ins.customDipDirColor2.value[1],
            this.ins.customDipDirColor2.value[2]
        ]);
        const color3: Color = new Color().fromArray([
            this.ins.customDipDirColor3.value[0],
            this.ins.customDipDirColor3.value[1],
            this.ins.customDipDirColor3.value[2]
        ]);
        const color4: Color = new Color().fromArray([
            this.ins.customDipDirColor4.value[0],
            this.ins.customDipDirColor4.value[1],
            this.ins.customDipDirColor4.value[2]
        ]);
    
        const models = this.getGraphComponents(CVModel2);
        models.forEach(model => {
            model.setDipDirectionColors(color1, color2, color3, color4);
        });
    }
    
    // preRender(context)
    // {
    //     const qualityName = this.ins.quality.getOptionText();
    //     context.viewport.overlay.setLabel(ELocation.BottomRight, "quality", `Quality: ${qualityName}`);
    // }

    fromData(data: IViewer)
    {
        const ins = this.ins;

        ins.copyValues({
            shader: EShaderMode[data.shader] || EShaderMode.Default,
            exposure: data.exposure !== undefined ? data.exposure : ins.exposure.schema.preset,
            toneMapping: data.toneMapping || false,
            gamma: data.gamma !== undefined ? data.gamma : ins.gamma.schema.preset,
            isWallMountAR: data.isWallMountAR || false,
            arScale: data.arScale || 1.0,
            annotationsVisible: !!data.annotationsVisible,
            activeTags: data.activeTags || "",
            sortedTags: data.sortedTags || "",
            radioTags: data.radioTags !== undefined ? !!data.radioTags : ins.radioTags.schema.preset,
        });
    }

    toData(): IViewer
    {
        const ins = this.ins;

        const data: Partial<IViewer> = {
            shader: EShaderMode[ins.shader.value] as TShaderMode,
            exposure: ins.exposure.value,
            toneMapping: ins.toneMapping.value,
            gamma: ins.gamma.value,
            isWallMountAR: ins.isWallMountAR.value,
            arScale: ins.arScale.value
        };

        if (ins.annotationsVisible.value) {
            data.annotationsVisible = true;
        }
        if (ins.activeTags.value) {
            data.activeTags = ins.activeTags.value;
        }
        if (ins.sortedTags.value) {
            data.sortedTags = ins.sortedTags.value;
        }
        if (ins.radioTags.value) {
            data.radioTags = ins.radioTags.value;
        }

        return data as IViewer;
    }

    protected refreshTagCloud()
    {
        const tagCloud = new Set<string>();

        const models = this.getGraphComponents(CVModel2);
        models.forEach(model => {
            const tags = model.ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
            tags.forEach(tag => tagCloud.add(tag));
        });

        const views = this.getGraphComponents(CVAnnotationView);
        views.forEach(component => {
            const annotations = component.getAnnotations();
            annotations.forEach(annotation => {
                const tags = annotation.tags;
                tags.forEach(tag => {
                    tagCloud.add(tag)
                });
            });
        });

        const tagArray = Array.from(tagCloud);
        const sortedTags = this.ins.sortedTags.value.split(",").map(tag => tag.trim()).filter(tag => tag);

        tagArray.sort((a, b) => {
           const aIndex = sortedTags.indexOf(a);
           const bIndex = sortedTags.indexOf(b);
           return aIndex < bIndex ? -1 : (aIndex > bIndex ? 1 : 0);
        });

        this.outs.tagCloud.setValue(tagArray.join(", "));

        // refresh tag display
        this.ins.activeTags.set();
        this.ins.annotationsVisible.set();

        if (ENV_DEVELOPMENT) {
            console.log("CVViewer.refreshTagCloud - %s", tagArray.join(", "));
        }
    }

    protected onAnnotationClick(event: IAnnotationClickEvent)
    {
        const id = event.annotation ? event.annotation.id : "";
        this.ins.activeAnnotation.setValue(id);

        this.rootElement.dispatchEvent(new CustomEvent('annotation-active', { detail: id }));
    }

    protected onModelComponent(event: IComponentEvent<CVModel2>)
    {
        const component = event.object;

        if (event.add) {
            component.on<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
            component.on<IModelLoadEvent>("model-load", this.onModelLoad, this);
        }
        else if (event.remove) {
            component.off<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
            component.off<IModelLoadEvent>("model-load", this.onModelLoad, this);
        }
    }

    protected onAnnotationsComponent(event: IComponentEvent<CVAnnotationView>)
    {
        const component = event.object;

        if (event.add) {
            component.on<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
            component.on<IAnnotationClickEvent>("click", this.onAnnotationClick, this);
            component.ins.visible.setValue(this.ins.annotationsVisible.value);
        }
        else if (event.remove) {
            component.off<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
            component.off<IAnnotationClickEvent>("click", this.onAnnotationClick, this);
        }
    }

    protected onLanguageComponent(event: IComponentEvent<CVLanguageManager>)
    {
        const component = event.object;

        if (event.add) {
            component.on<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
        }
        else if (event.remove) {
            component.off<ITagUpdateEvent>("tag-update", this.refreshTagCloud, this);
        }
    }

    protected onModelLoad(event: IModelLoadEvent) {
        this.rootElement.dispatchEvent(new CustomEvent('model-load', { detail: EDerivativeQuality[event.quality] }));
        this.refreshTagCloud();
    }
}