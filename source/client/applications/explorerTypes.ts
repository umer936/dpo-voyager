/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import CVNodeProvider from "../components/CVNodeProvider";

import CVToolProvider from "../components/CVToolProvider";
import CVViewTool from "../components/CVViewTool";
import CVRenderTool from "../components/CVRenderTool";
import CVEnvironmentTool from "../components/CVEnvironmentTool";
import CVLightTool from "../components/CVLightTool";
import CVTapeTool from "../components/CVTapeTool";
import CVPolylineTool from "../components/CVPolylineTool";
import CVSliceTool from "../components/CVSliceTool";

import NVTools from "../nodes/NVTools";

////////////////////////////////////////////////////////////////////////////////

const types = [
    CVNodeProvider,

    CVToolProvider,
    CVViewTool,
    CVRenderTool,
    CVEnvironmentTool,
    CVLightTool,
    CVTapeTool,
    CVPolylineTool,
    CVSliceTool,

    NVTools,
];

export default types;