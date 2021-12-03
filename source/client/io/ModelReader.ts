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

//import resolvePathname from "resolve-pathname";
import { LoadingManager, Object3D, Scene, Group, Mesh, MeshStandardMaterial, sRGBEncoding, WebGLRenderer } from "three";

import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';

import UberPBRMaterial from "../shaders/UberPBRMaterial";

////////////////////////////////////////////////////////////////////////////////

const DEFAULT_DRACO_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.3.6/";
const DEFAULT_KTX2_PATH = "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/";

export default class ModelReader
{
    static readonly extensions = [ "gltf", "glb" ];
    static readonly mimeTypes = [ "model/gltf+json", "model/gltf-binary" ];

    protected loadingManager: LoadingManager;
    protected gltfLoader;
    protected ktx2Loader: KTX2Loader;
    protected ktx2NeedsInit: boolean = true;

    protected customDracoPath = null;

    set dracoPath(path: string) 
    {
        this.customDracoPath = path;
        if(this.gltfLoader.dracoLoader !== null) {
            this.gltfLoader.dracoLoader.setDecoderPath(this.customDracoPath);
        }
    }
   
    constructor(loadingManager: LoadingManager)
    {
        this.loadingManager = loadingManager;

        //const dracoPath = resolvePathname("js/draco/", window.location.origin + window.location.pathname);

        if (ENV_DEVELOPMENT) {
            console.log("ModelReader.constructor - DRACO path: %s", this.customDracoPath || DEFAULT_DRACO_PATH);
        }

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(this.customDracoPath || DEFAULT_DRACO_PATH);

        this.ktx2Loader = new KTX2Loader();
        this.ktx2Loader.setTranscoderPath(/*this.customKTX2Path ||*/ DEFAULT_KTX2_PATH);

        this.gltfLoader = new GLTFLoader(loadingManager);
        this.gltfLoader.setDRACOLoader(dracoLoader);
        this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    }

    dispose()
    {
        this.gltfLoader.dracoLoader.dispose();
        this.gltfLoader.setDRACOLoader(null);
        this.ktx2Loader.dispose();
        this.gltfLoader.setKTX2Loader(null);
        this.gltfLoader = null;
    }

    initKTX2Loader(renderer: WebGLRenderer) {
        if(this.ktx2NeedsInit) {
            this.ktx2Loader.detectSupport(renderer);
            this.ktx2NeedsInit = false;
        }
    }

    isValid(url: string): boolean
    {
        const extension = url.split(".").pop().toLowerCase();
        return ModelReader.extensions.indexOf(extension) >= 0;
    }

    isValidMimeType(mimeType: string): boolean
    {
        return ModelReader.mimeTypes.indexOf(mimeType) >= 0;
    }

    get(url: string): Promise<Object3D>
    {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(url, gltf => {
                resolve(this.createModelGroup(gltf));
            }, null, error => {
                console.error(`failed to load '${url}': ${error}`);
                reject(new Error(error));
            })
        });
    }

    protected createModelGroup(gltf): Object3D
    {
        const scene: Scene = gltf.scene;

        scene.traverse((object: any) => {
            if (object.type === "Mesh") {
                const mesh: Mesh = object;
                mesh.castShadow = true;
                const material = mesh.material as MeshStandardMaterial;

                if (material.map) {
                   material.map.encoding = sRGBEncoding;
                }

                mesh.geometry.computeBoundingBox();

                const uberMat = new UberPBRMaterial();

                // copy properties from previous material
                if (material.type === "MeshStandardMaterial") {
                    uberMat.copyStandardMaterial(material);
                }

                // check if the material's normal map uses object space (indicated in glTF extras)
                if (material.userData["objectSpaceNormals"]) {
                    uberMat.enableObjectSpaceNormalMap(true);

                    if (ENV_DEVELOPMENT) {
                        console.log("ModelReader.createModelGroup - objectSpaceNormals: ", true);
                    }
                }

                mesh.material = uberMat;
            }
        });

        return scene;
    }
}