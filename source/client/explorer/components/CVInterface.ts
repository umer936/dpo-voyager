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

import Component, { types } from "@ff/graph/Component";

import { IInterface } from "common/types/setup";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    visible: types.Boolean("Interface.Visible", true),
    logo: types.Boolean("Interface.Logo", true),
};

export default class CVInterface extends Component
{
    static readonly type: string = "CVInterface";

    ins = this.addInputs(ins);


    fromData(data: IInterface)
    {
        this.ins.setValues({
            visible: data.visible,
            logo: data.logo
        });
    }

    toData(): IInterface
    {
        const ins = this.ins;

        return {
            visible: ins.visible.value,
            logo: ins.logo.value
        };
    }
}