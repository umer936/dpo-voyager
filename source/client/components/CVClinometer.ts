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

import {
    Matrix3,
    Vector3,
    Box3,
    Line,
    Group,
    BufferGeometry,
    LineBasicMaterial,
    Box3Helper,
    BufferAttribute,
    LineLoop, CircleGeometry, MeshBasicMaterial, Mesh
} from "three";

import CObject3D, { Node, types, IPointerEvent } from "@ff/scene/components/CObject3D";

import { IClinometer } from "client/schema/setup";

import Pin from "../utils/Pin";
import CVModel2 from "./CVModel2";
import CVScene from "client/components/CVScene";
import { EUnitType } from "client/schema/common";
import unitScaleFactor from "client/utils/unitScaleFactor";
import { getMeshTransform } from "client/utils/Helpers";
import Annotation from "../models/Annotation";
import CVStaticAnnotationView from "./CVStaticAnnotationView";

////////////////////////////////////////////////////////////////////////////////

const _mat3 = new Matrix3();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3up = new Vector3(0, 1, 0);
export enum EClinometerState { SetStart, SetEnd }

export default class CVClinometer extends CObject3D
{
    static readonly typeName: string = "CVClinometer";

    static readonly text: string = "Clinometer";
    static readonly icon: string = "";

    protected static readonly ClinometerIns = {
        circleCenter: types.Vector3("Start.Position"),
        startDirection: types.Vector3("Start.Direction"),
        circleRadius: types.Vector3("End.Position"),
        endDirection: types.Vector3("End.Direction"),
        boundingBox: types.Object("Scene.BoundingBox", Box3),
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        enabled: types.Boolean("Clinometer.Enabled", false),
    };

    protected static readonly ClinometerOuts = {
        state: types.Enum("Clinometer.State", EClinometerState),
        radius: types.Number("Clinometer.Radius"),
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 })
    };

    ins = this.addInputs<CObject3D, typeof CVClinometer.ClinometerIns>(CVClinometer.ClinometerIns);
    outs = this.addOutputs<CObject3D, typeof CVClinometer.ClinometerOuts>(CVClinometer.ClinometerOuts);

    get settingProperties() {
        return [
            this.ins.visible,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.visible,
            this.ins.circleCenter,
            this.ins.startDirection,
            this.ins.circleRadius,
            this.ins.endDirection,
        ];
    }

    protected startPin: Pin = null;
    protected endPin: Pin = null;
    protected line: Mesh<CircleGeometry, MeshBasicMaterial> = null;
    protected annotationView: CVStaticAnnotationView = null;
    protected label: Annotation = null;

    constructor(node: Node, id: string) {
        super(node, id);

        this.object3D = new Group();

        this.startPin = new Pin();
        this.startPin.matrixAutoUpdate = false;
        this.startPin.visible = false;

        this.endPin = new Pin();
        this.endPin.matrixAutoUpdate = false;
        this.endPin.visible = false;

        // Calculate the radius based on the distance between startPin and endPin
        const radius = this.startPin.position.distanceTo(this.endPin.position);

        // Create geometry for the circle
        const geometry = new CircleGeometry(radius);

        const lineMaterial = new MeshBasicMaterial();
        lineMaterial.depthTest = false;
        lineMaterial.transparent = true;

        this.line = new Mesh(geometry, lineMaterial);
        this.line.visible = false;

        // add radius label
        this.annotationView = this.node.createComponent(CVStaticAnnotationView);
        const annotation = this.label = new Annotation(undefined);
        annotation.data.style = "Standard";
        annotation.data.position = [0,0,0];
        annotation.data.direction = [0,0,0]
        this.annotationView.ins.visible.setValue(false);
        this.annotationView.addAnnotation(annotation);

        this.object3D.add(this.startPin, this.endPin, this.line);
    }


    create()
    {
        super.create();

        const scene = this.getGraphComponent(CVScene);
        this.ins.boundingBox.linkFrom(scene.outs.boundingBox);
        this.ins.globalUnits.linkFrom(scene.ins.units);
    }

    dispose()
    {
        this.startPin = null;
        this.endPin = null;
        this.line = null;

        super.dispose();
    }

    update(context)
    {
        const lineGeometry = this.line.geometry as BufferGeometry;
        const { startPin, endPin, line, ins } = this;

        if (ins.enabled.changed) {
            ins.visible.setValue(ins.enabled.value);
        }

        super.update(context);

        // determine pin scale based on scene/model bounding box
        if (ins.boundingBox.changed && ins.boundingBox.value) {
            ins.boundingBox.value.getSize(_vec3a);
            const radius = _vec3a.length() * 0.5;

            startPin.scale.setScalar(radius * 0.003);
            startPin.updateMatrix();

            endPin.scale.setScalar(radius * 0.003);
            endPin.updateMatrix();
        }

        // if Clinometer is enabled, listen for pointer events to set Clinometer start/end
        if (ins.enabled.changed) {
            if (ins.enabled.value) {
                this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
                this.annotationView.ins.visible.setValue(this.outs.radius.value > 0);
            }
            else {
                this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
                this.annotationView.ins.visible.setValue(false);
            }
        }

        if(ins.visible.changed) {
            if(ins.visible.value) {
                const startPos = ins.circleCenter.value;
                const endPos = ins.circleRadius.value;
                if(startPos[0] != endPos[0] || startPos[1] != endPos[1] || startPos[2] != endPos[2]) {
                    startPin.visible = true;
                    endPin.visible = true;
                    line.visible = true;
                    this.annotationView.ins.visible.setValue(true);
                }
            }
            else {
                this.annotationView.ins.visible.setValue(false);
            }
        }

        if (ins.globalUnits.changed) {
            this.updateUnitScale();
        }

        // update Clinometer start point
        if (ins.circleCenter.changed || ins.startDirection.changed) {
            startPin.position.fromArray(ins.circleCenter.value);
            _vec3a.fromArray(ins.startDirection.value);
            startPin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            startPin.updateMatrix();

            const positions = (lineGeometry.attributes.position as BufferAttribute).array as Float64Array;//Array<number>;
            positions[0] = startPin.position.x;
            positions[1] = startPin.position.y;
            positions[2] = startPin.position.z;
            lineGeometry.attributes.position.needsUpdate = true;
            this.annotationView.ins.visible.setValue(false);
        }

        // update Clinometer end point
        if (ins.circleRadius.changed || ins.endDirection.changed) {
            endPin.position.fromArray(ins.circleRadius.value);
            _vec3a.fromArray(ins.endDirection.value);
            endPin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
            endPin.updateMatrix();

            const positions = (lineGeometry.attributes.position as BufferAttribute).array as Float64Array;//Array<number>;
            positions[3] = endPin.position.x;
            positions[4] = endPin.position.y;
            positions[5] = endPin.position.z;
            lineGeometry.attributes.position.needsUpdate = true;

            // update radius between measured points
            _vec3a.fromArray(ins.circleCenter.value);
            _vec3b.fromArray(ins.circleRadius.value);
            const ClinometerLength = _vec3a.distanceTo(_vec3b);
            this.outs.radius.setValue(ClinometerLength);

            // update radius label
            const data = this.label.data;
            data.position = [(positions[0]+positions[3])/2.0,(positions[1]+positions[4])/2.0,(positions[2]+positions[5])/2.0];
            const units = this.ins.globalUnits.getOptionText();
            this.label.title = ClinometerLength.toFixed(2) + " " + units;
            this.annotationView.updateAnnotation(this.label, true);
            if(ClinometerLength > 0 && this.ins.visible.value) {
                this.annotationView.ins.visible.setValue(true);
            }
        }

        return true;
    }

    fromData(data: IClinometer)
    {
        this.ins.copyValues({
            visible: data.enabled,   // TODO: should probably be visible instead of enabled
            /*circleCenter: data.circleCenter,
            startDirection: data.startDirection,
            circleRadius: data.circleRadius,
            endDirection: data.endDirection*/
        });
    }

    toData(): IClinometer
    {
        const ins = this.ins;

        return {
            enabled: ins.visible.cloneValue()/*,
            circleCenter: ins.circleCenter.cloneValue(),
            startDirection: ins.startDirection.cloneValue(),
            circleRadius: ins.circleRadius.cloneValue(),
            endDirection: ins.endDirection.cloneValue()*/
        };
    }

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
        const { startPin, endPin, line, ins, outs } = this;

        if (outs.state.value === EClinometerState.SetStart) {
            position.toArray(ins.circleCenter.value);
            normal.toArray(ins.startDirection.value);
            ins.circleCenter.set();
            ins.startDirection.set();

            startPin.visible = true;
            endPin.visible = false;
            line.visible = false;

            outs.state.setValue(EClinometerState.SetEnd);
        }
        else {
            position.toArray(ins.circleRadius.value);
            normal.toArray(ins.endDirection.value);
            ins.circleRadius.set();
            ins.endDirection.set();

            // set end position of Clinometer
            startPin.visible = true;
            endPin.visible = true;
            line.visible = true;

            outs.state.setValue(EClinometerState.SetStart);
        }
    }

    protected updateUnitScale()
    {
        const ins = this.ins;
        const fromUnits = ins.localUnits.getValidatedValue();
        const toUnits = ins.globalUnits.getValidatedValue();
        this.outs.unitScale.setValue(unitScaleFactor(fromUnits, toUnits));

        _vec3a.fromArray(ins.circleCenter.value);
        ins.circleCenter.setValue(_vec3a.multiplyScalar(this.outs.unitScale.value).toArray());
        _vec3a.fromArray(ins.circleRadius.value);
        ins.circleRadius.setValue(_vec3a.multiplyScalar(this.outs.unitScale.value).toArray());

        ins.localUnits.setValue(toUnits);
    }
}
