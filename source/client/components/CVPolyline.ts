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

import { Matrix3, Vector3, Box3, Line, Group, BufferGeometry, LineBasicMaterial, Box3Helper, BufferAttribute, Color } from "three";

import CObject3D, { Node, types, IPointerEvent } from "@ff/scene/components/CObject3D";

import { ITape } from "client/schema/setup";

import Pin from "../utils/Pin";
import CVModel2 from "./CVModel2";
import CVScene from "client/components/CVScene";
import { EUnitType } from "client/schema/common";
import unitScaleFactor from "client/utils/unitScaleFactor";
import { getMeshTransform } from "client/utils/Helpers";

////////////////////////////////////////////////////////////////////////////////

const _mat3 = new Matrix3();
const _vec3a = new Vector3();
const _vec3up = new Vector3(0, 1, 0);

export enum EPolylineState { SetStart, SetNext }

export default class CVPolyline extends CObject3D
{
    static readonly typeName: string = "CVPolyline";

    static readonly text: string = "Polyline";
    static readonly icon: string = "";

    protected static readonly polylineIns = {
        boundingBox: types.Object("Scene.BoundingBox", Box3),
        enabled: types.Boolean("Polyline.Enabled", false),
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        color: types.Vector3("Polyline.Color", [1, 1, 1]), // Default color white
    };

    protected static readonly polylineOuts = {
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
        state: types.Enum("Polyline.State", EPolylineState),
    };

    ins = this.addInputs<CObject3D, typeof CVPolyline.polylineIns>(CVPolyline.polylineIns);
    outs = this.addOutputs<CObject3D, typeof CVPolyline.polylineOuts>(CVPolyline.polylineOuts);

    get settingProperties() {
        return [
            this.ins.visible,
        ];
    }

    protected pins: Pin[] = [];
    protected lines: Line[] = [];
    protected polylines: { pins: Pin[], lines: Line[] }[] = [];

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new Group();
        this.pins = [];
        this.lines = [];
        this.polylines = [];
    }

    create()
    {
        super.create();

        const scene = this.getGraphComponent(CVScene);
        this.ins.boundingBox.linkFrom(scene.outs.boundingBox);

        // Listen for keydown events
        window.addEventListener("keydown", this.onKeyDown);

        // Listen for changes to the color input
        this.ins.color.on("value", this.onColorChanged);
    }

    dispose()
    {
        // Remove pins
        this.pins.forEach(pin => {
            pin = null;
        });
        this.pins.length = 0;

        // Remove lines
        this.lines.forEach(line => {
            line = null;
        });
        this.lines.length = 0;

        // Remove polylines
        this.polylines.forEach(polyline => {
            polyline = null;
        });
        this.polylines.length = 0;

        super.dispose();
    }

    update(context)
    {
        const { pins, lines, polylines, ins } = this;

        if (ins.enabled.changed) {
            ins.visible.setValue(ins.enabled.value);
        }

        super.update(context);

        // if tape is enabled, listen for pointer events to set polyline points
        if (ins.enabled.changed) {
            if (ins.enabled.value) {
                this.outs.state.setValue(EPolylineState.SetStart);
                this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
            else {
                this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
        }

        if(ins.visible.changed) {
            if(ins.visible.value) {
                for (let i = 0; i < pins.length - 1; i++) {
                    const pin = pins[i];
                    const line = lines[i];
                    const nextPin = pins[i + 1];
                    // Check if the pin's position is different from the next pin
                    if (pin.position.distanceTo(nextPin.position) > 0) {
                        pin.visible = true;
                        line.visible = true;
                    } else {
                        pin.visible = false;
                        line.visible = false;
                    }
                }
                
                // Handle the last pin separately
                const lastPin = pins[pins.length - 1];
                if (lastPin) {
                    lastPin.visible = ins.visible.value;
                }
            }
        }

        if (ins.globalUnits.changed) {
            this.updateUnitScale();
        }

        return true;
    }

    fromData(data: ITape)
    {
        this.ins.copyValues({
            visible: data.enabled,   // TODO: should probably be visible instead of enabled
        });
    }

    toData(): ITape
    {
        const ins = this.ins;

        return {
            enabled: ins.visible.cloneValue()
        };
    }

    protected endPolyline() {
        if (this.pins.length > 0) {
            this.polylines.push({ pins: [...this.pins], lines: [...this.lines] });
            this.pins = [];
            this.lines = [];
            this.outs.state.setValue(EPolylineState.SetStart);
        }
    }
    

    protected onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            this.endPolyline();
        }
    };    

    protected onPointerUp(event: IPointerEvent)
    {
        if (event.isDragging || !event.component || !event.component.is(CVModel2)) {
            return;
        }

        // Compensate for any internal transforms the loaded geometry may have
        const model = event.component as CVModel2;
        const meshTransform = getMeshTransform(model.object3D, event.object3D);
        const bounds = model.localBoundingBox.clone().applyMatrix4(meshTransform);

        // get click position and normal
        const worldMatrix = event.object3D.matrixWorld;
        _mat3.getNormalMatrix(worldMatrix);

        const position = event.view.pickPosition(event, bounds).applyMatrix4(worldMatrix); 
        const normal = event.view.pickNormal(event).applyMatrix3(_mat3).normalize();

        // update pins and measurement line
        const { pins, lines, ins, outs } = this;

        if (outs.state.value === EPolylineState.SetStart) 
        {
            const pin = new Pin();
            pin.matrixAutoUpdate = false;
            pin.visible = true;
            pin.position.copy(position);
            _vec3a.copy(normal);
            pin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            pin.scale.setScalar(.1);
            pin.updateMatrix();
            pins.push(pin);
            this.object3D.add(pin);

            outs.state.setValue(EPolylineState.SetNext);
        }
        else {
            const pin = new Pin();
            pin.matrixAutoUpdate = false;
            pin.visible = true;
            pin.position.copy(position);
            _vec3a.copy(normal);
            pin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            pin.scale.setScalar(.1);
            pin.updateMatrix();
            pins.push(pin);
            this.object3D.add(pin);

            const points = [];
            points.push(pins[pins.length - 2].position)
            points.push(pins[pins.length - 1].position)
            const lineGeometry = new BufferGeometry().setFromPoints(points);
            const lineMaterial = new LineBasicMaterial({color: new Color().fromArray(ins.color.value)});
            lineMaterial.depthTest = false;
            lineMaterial.transparent = true;
            const line = new Line(lineGeometry, lineMaterial);
            line.visible = true;
            this.lines.push(line);
            this.object3D.add(line);
        }
    }

    protected updateUnitScale()
    {
        const ins = this.ins;
        const fromUnits = ins.localUnits.getValidatedValue();
        const toUnits = ins.globalUnits.getValidatedValue();
        this.outs.unitScale.setValue(unitScaleFactor(fromUnits, toUnits));

        this.pins.forEach(pin => {
            _vec3a.copy(pin.position);
            pin.position.copy(_vec3a.multiplyScalar(this.outs.unitScale.value));
        });

        ins.localUnits.setValue(toUnits);
    }

    protected onColorChanged = () => {
        const color = new Color().fromArray(this.ins.color.value);

        this.lines.forEach(line => {
            (line.material as LineBasicMaterial).color.copy(color);
        });
    }
}