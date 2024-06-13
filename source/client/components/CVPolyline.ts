import { Matrix3, Vector3, Box3, Group, BufferGeometry, Color, Mesh } from "three";
import CObject3D, { Node, types, IPointerEvent } from "@ff/scene/components/CObject3D";
import { IPolylines } from "client/schema/setup";
import Pin from "../utils/Pin";
import CVModel2 from "./CVModel2";
import CVScene from "client/components/CVScene";
import { EUnitType } from "client/schema/common";
import unitScaleFactor from "client/utils/unitScaleFactor";
import { getMeshTransform } from "client/utils/Helpers";
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from "../utils/THREE.meshline.js";
import CVTape from "./CVTape";

////////////////////////////////////////////////////////////////////////////////

const _mat3 = new Matrix3();
const _vec3a = new Vector3();
const _vec3up = new Vector3(0, 1, 0);

export enum EPolylineState { SetStart, SetNext }

interface ColorLabelMap {
    [color: string]: string;
}

type Polyline = {
    pins: Pin[];
    lines: Mesh[];
    label: string;
};

export default class CVPolyline extends CObject3D {
    static readonly typeName: string = "CVPolyline";
    static readonly text: string = "Polyline";
    static readonly icon: string = "";

    protected static readonly polylineIns = {
        boundingBox: types.Object("Scene.BoundingBox", Box3),
        enabled: types.Boolean("Polyline.Enabled", false),
        globalUnits: types.Enum("Model.GlobalUnits", EUnitType, EUnitType.cm),
        localUnits: types.Enum("Model.LocalUnits", EUnitType, EUnitType.cm),
        color: types.Vector3("Polyline.Color", [1, 1, 1]), // Default color white
        label: types.String("Polyline.Label", ""), // Label property
        undo: types.Boolean("Polyline.Undo", false)
    };

    protected static readonly polylineOuts = {
        unitScale: types.Number("UnitScale", { preset: 1, precision: 5 }),
        state: types.Enum("Polyline.State", EPolylineState),
    };

    ins = this.addInputs<CObject3D, typeof CVPolyline.polylineIns>(CVPolyline.polylineIns);
    outs = this.addOutputs<CObject3D, typeof CVPolyline.polylineOuts>(CVPolyline.polylineOuts);
    colorLabelMap: ColorLabelMap = {};

    get settingProperties() {
        return [
            this.ins.visible,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.visible
        ];
    }

    protected pins: Pin[] = [];
    protected lines: Mesh[] = [];
    protected polylines: { pins: Pin[], lines: Mesh[], label: string }[] = [];

    constructor(node: Node, id: string) {
        super(node, id);

        this.object3D = new Group();
        this.pins = [];
        this.lines = [];
        this.polylines = [];
    }

    create() {
        super.create();

        const scene = this.getGraphComponent(CVScene);
        this.ins.boundingBox.linkFrom(scene.outs.boundingBox);
        this.ins.globalUnits.linkFrom(scene.ins.units);

        // Listen for keydown events
        window.addEventListener("keydown", this.onKeyDown);

        // Listen for changes to the color input
        this.ins.color.on("value", this.onColorChanged);
    }

    dispose() {
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

    update(context) {
        const { pins, lines, ins } = this;

        if (ins.enabled.changed) {
            ins.visible.setValue(ins.enabled.value);
        }

        if (ins.undo.changed) {
            this.handleUndoAction();
        }

        super.update(context);

        // if tape is enabled, listen for pointer events to set polyline points
        if (ins.enabled.changed) {
            if (ins.enabled.value) {
                this.outs.state.setValue(EPolylineState.SetStart);
                this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
            } else {
                this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
            }
        }

        if (ins.visible.changed) {
            if (ins.visible.value) {
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

    // fromData(data: IPolyline) {
    //     this.ins.copyValues({
    //         visible: data.enabled, 
    //     });
    // }

    toData(): IPolylines {
        return this.polylines.map(polyline => {
            const points = polyline.pins.map(pin => {
                return {
                    position: [pin.position.x, pin.position.y, pin.position.z]
                };
            });
            
            return {
                label: polyline.label,
                points: points
            };
        });
    }
    
    protected endPolyline() {
        if (this.pins.length > 0) {
            this.polylines.push({ pins: [...this.pins], lines: [...this.lines], label: this.ins.label.value });
            if (this.pins.length > 0) {
                const lastPin = this.pins[this.pins.length - 1];
                lastPin.visible = false;
            }
            this.pins = [];
            this.lines = [];
            this.outs.state.setValue(EPolylineState.SetStart);
        }
    }

    getNumPins(): number {
        return this.pins.length; // Return the number of pins in the pins array
    }

    getNumLines(): number {
        return this.lines.length; // Return the number of lines in the lines array
    }

    getNumPolylines(): number {
        return this.polylines.length; // Return the number of polylines in the polylines array
    }

    popPin(): Pin | undefined {
        return this.pins.pop(); // Remove and return the last pin from the pins array
    }

    popLine(): Mesh | undefined {
        return this.lines.pop(); // Remove and return the last line from the lines array
    }

    clearAllLines(polyline: Polyline)
    {
        polyline.lines.forEach(line => {
            this.object3D.remove(line);
        });
    }

    removeLastPolyline() {
        const lastPolyline = this.popPolyline(); // Remove and return the last line from the lines array
        this.clearAllLines(lastPolyline);
    }

    popPolyline(): Polyline | undefined {
        return this.polylines.pop();
    }

    handleUndoAction() {
        if (this.getNumPins() > 0) {
            console.log("Attempting to remove last pin");
            this.popPin();
            if (this.getNumLines() > 0) {
                console.log("Number of lines is " + this.getNumLines());
                console.log("Attempting to remove last pin's line");
                const lastLine = this.popLine();
                console.log(lastLine);
                this.object3D.remove(lastLine);
            }
        } else {
            // If there are no points added yet, remove the last polyline added (if any)
            if (this.getNumPolylines() > 0) {
                this.removeLastPolyline();
            }
        }
    }

    protected onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            this.endPolyline();
        }
    };

    protected onPointerUp(event: IPointerEvent) {
        if (event.isDragging || !event.component || !event.component.is(CVModel2) || this.ins.label.value == "") {
            return;
        }
        if (CVTape.tapeEnabled) {
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

        // Slightly offset the position along the normal to prevent submerging
        position.addScaledVector(normal, 0.01);

        // update pins and line
        const { pins, lines, ins, outs } = this;

        // Hide the previous pin
        if (pins.length > 0) {
            const lastPin = pins[pins.length - 1];
            lastPin.visible = false;
        }

        const pin = new Pin();
        pin.matrixAutoUpdate = false;
        pin.visible = true;
        pin.position.copy(position);
        _vec3a.copy(normal);
        pin.quaternion.setFromUnitVectors(_vec3up, _vec3a);
        pin.scale.setScalar(.1);
        pin.updateMatrix();
        pins.push(pin);

        if (outs.state.value === EPolylineState.SetNext) {
            const points = [];
            points.push(pins[pins.length - 2].position)
            points.push(pins[pins.length - 1].position)
            const geometry = new BufferGeometry().setFromPoints(points);
            const line = new MeshLine();
            line.setGeometry(geometry);
            line.depthTest = false;
            line.transparent = true;
            line.depthWrite = false;
            line.renderOrder = 1;

            // Adjusting material properties to avoid z-fighting
            const material = new MeshLineMaterial({
                color: new Color().fromArray(ins.color.value),
                lineWidth: 0.025,
                polygonOffset: true,
                polygonOffsetFactor: -1000,
                polygonOffsetUnits: -1000
            });

            const mesh = new Mesh(line.geometry, material);
            mesh.renderOrder = 1; // Ensure it renders on top
            lines.push(mesh);
            this.object3D.add(mesh);
        }

        outs.state.setValue(EPolylineState.SetNext);
    }

    protected updateUnitScale() {
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
            (line.material as MeshLineMaterial).color.copy(color);
        });
    }
}
