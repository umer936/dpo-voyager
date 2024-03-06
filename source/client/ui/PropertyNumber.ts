
import Property from "@ff/graph/Property";
import CustomElement, { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import PropertyField from "@ff/scene/ui/PropertyField";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-number")
export default class PropertyNumber extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    /**
     * Handles vector properties by specifying an array index.
     */
    @property({ type: Number, reflect: false })
    index = undefined;

    delta :number;

    get value(){
        return typeof this.index ==="number"? this.property.value[this.index]: this.property.value
    }

    protected firstConnected()
    {
        this.classList.add("sv-property", "sv-property-number");
        this.addEventListener("pointerdown", this.onPointerDown);
        this.addEventListener("pointerup", this.onPointerUp);
        this.addEventListener("pointercancel", this.onPointerUp);
    }

    
    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
        }

        if (this.property.type !== "number") {
            throw new Error("not an number property");
        }

        if (changedProperties.has("property")) {
            const property = changedProperties.get("property") as Property;
            if (property) {
                property.off("value", this.onUpdate, this);
            }
            if (this.property) {
                this.property.on("value", this.onUpdate, this);
            }
        }

        super.update(changedProperties);
    }

    protected render()
    {
        const property = this.property;
        const schema = property.schema;
        const name = this.name || property.name;
        const min = schema.min;
        const max = schema.max;
        const bounded = isFinite(min) && isFinite(max);
        const value = this.value;
        let text :string;
        
        if(!isFinite(value)){
            text = value > 0 ? "inf" : "-inf";
        }else{
            const precision = schema.precision !== undefined
            ? schema.precision : PropertyField.defaultPrecision;

            if (schema.percent) {
                text = (value * 100).toFixed(precision - 2);
            } else {
                text = value.toFixed(precision);
            }

        }

        return html`
            <label class="ff-label ff-off">${name}</label>
            <div class="sv-property-field">
                ${bounded? html`<span class="ff-off ff-bar" style="width:${ 100*(value - min) / (max - min)}%;"></span>`:null}
                <input class="ff-input"
                    type="text"
                    pattern="[+\\-]?([0-9.]+|inf)${schema.percent ? "%?" : ""}"
                    step=${schema.step ?? ""}
                    min=${min ?? ""}
                    max=${max ?? ""}
                    value=${text}
                    @change=${this.onChange}
                    @focus=${(e)=>{ e.target.select();}}}
                    @keypress=${(e)=>{if(e.key === "Enter"){e.target.blur();}}}
                >
                ${schema.percent ? html`<span class="ff-off ff-unit">%</span>` : null}
            </div>
        `;
    }

    protected setValue(value: number){
        if(typeof this.index === "number" && 0 <= this.index){
            this.property.value[this.index] = value;
            this.property.set();
        }else{
            this.property.setValue(value);
        }
    }

    protected onChange = (event: Event) => {
        let text = (event.target as HTMLInputElement).value;

        if (text.toLowerCase().indexOf("inf") >= 0) {
            this.setValue(text[0] === "-" ? -Infinity : Infinity);
            return;
        }
        let value :number;
        if(this.property.schema.percent && text.endsWith("%")){
            value = +text.slice(0, -1) /100;
        }else{
            value = parseFloat(text);
        }

        this.setValue(value);
    }



    protected onPointerDown = (event: PointerEvent)=>{
        if (!event.isPrimary || event.button !== 0) {
            return;
        }
        if(!isFinite(this.value)){
            return; //No point in incrementing +/-infinity.
        }
        const target = event.target as HTMLInputElement;
        if((target.tagName !== "INPUT" && !target.classList.contains("sv-property-field")) || target == document.activeElement) return;

        event.preventDefault();
        this.delta = 0;
        this.setPointerCapture(event.pointerId);
        this.addEventListener("pointermove", this.onPointerMove);
    }

    protected onPointerMove(event: PointerEvent)
    {
        event.stopPropagation();
        event.preventDefault();
        if(this.delta < 3){
            this.delta += Math.abs(event.movementX) + Math.abs(event.movementY);
            return;
        }

        const property = this.property;
        const schema = property.schema;
        let speed = PropertyField.defaultSpeed;
        if (schema.speed) {
            speed = schema.speed;
        } else if (schema.min !== undefined && schema.max !== undefined) {
            speed = (schema.max - schema.min) / this.clientWidth;
        }

        speed = event.ctrlKey ? speed * 0.1 : speed;
        speed = event.shiftKey ? speed * 10 : speed;
        let value = (this.value + event.movementX * speed);

        value = schema.step !== undefined ? Math.trunc(value / schema.step) * schema.step : value;

        value = schema.min !== undefined ? Math.max(value, schema.min) : value;
        value = schema.max !== undefined ? Math.min(value, schema.max) : value;

        const precision = schema.precision !== undefined
                            ? schema.precision : PropertyField.defaultPrecision;
        value = +value.toFixed(precision);


        this.setValue(value);
    }

    protected onPointerUp(event: PointerEvent)
    {
        if(!isFinite(this.delta)) return;
        this.removeEventListener("pointermove", this.onPointerMove);
        this.releasePointerCapture(event.pointerId);
        if(this.delta < 3){
            console.log("Focus");
            this.querySelector("input").focus();
        }
        this.delta = undefined;
    }
}