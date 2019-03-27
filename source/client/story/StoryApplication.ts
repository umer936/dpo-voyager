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

import parseUrlParameter from "@ff/browser/parseUrlParameter";
import Commander from "@ff/core/Commander";
import System from "@ff/graph/System";

import CPickSelection from "@ff/scene/components/CPickSelection";

import * as documentTemplate from "common/templates/document.json";

import ExplorerApplication, { IExplorerApplicationProps } from "../explorer/ExplorerApplication";

import { componentTypes as storyComponents } from "./components";
import { nodeTypes as storyNodes } from "./nodes";

import CVDocument from "../explorer/components/CVDocument";

import NVPrepTasks from "./nodes/NVPrepTasks";
import NVoyagerStory from "./nodes/NVoyagerStory";
import CVStoryController from "./components/CVStoryController";

import MainView from "./ui/MainView";

////////////////////////////////////////////////////////////////////////////////

/**
 * Initial properties of the Voyager Story main [[StoryApplication]].
 */
export interface IStoryApplicationProps extends IExplorerApplicationProps
{
    /** The page URL to navigate to when the user exits the story tool. */
    referrer?: string;
    /** The task set the application should display. Valid options: "prep" and "author". */
    mode?: string;
    /** When set to true, application displays additional expert level tools. */
    expert?: boolean;
}

/**
 * Voyager Story main application.
 */
export default class StoryApplication
{
    readonly props: IStoryApplicationProps;
    readonly explorer: ExplorerApplication;
    readonly system: System;
    readonly commander: Commander;


    constructor(parent: HTMLElement, props?: IStoryApplicationProps)
    {
        // create the embedded explorer application, parse properties, start loading/presenting
        this.explorer = new ExplorerApplication(null, props, /* embedded */ true);
        this.props = props || {};

        this.system = this.explorer.system;
        this.commander = this.explorer.commander;

        // register additional story tool components
        const registry = this.system.registry;
        registry.add(storyComponents);
        registry.add(storyNodes);

        //this.logController = new LogController(this.system, this.commander);

        // add story components
        this.system.graph.createCustomNode(NVoyagerStory, "Story");
        this.system.graph.createCustomNode(NVPrepTasks, "Tasks");

        // enable viewport brackets
        this.system.getMainComponent(CPickSelection).ins.viewportBrackets.setValue(true);

        if (parent) {
            // create a view and attach to parent
            new MainView(this).appendTo(parent);
        }

        // initialize default document
        this.openDocument(documentTemplate).then(() => {
            // start loading from properties
            this.evaluateProps();
        });
    }

    openDocument(document: any, documentPath?: string, merge?: boolean): Promise<CVDocument>
    {
        return this.explorer.openDocument(document, documentPath, merge);
    }

    loadDocument(documentPath: string, merge?: boolean): Promise<CVDocument>
    {
        return this.explorer.loadDocument(documentPath, merge);
    }

    loadModel(modelPath: string, quality: string)
    {
        return this.explorer.loadModel(modelPath, quality);
    }

    loadGeometry(geoPath: string, colorMapPath?: string,
                 occlusionMapPath?: string, normalMapPath?: string, quality?: string)
    {
        return this.explorer.loadGeometry(geoPath, colorMapPath, occlusionMapPath, normalMapPath, quality);
    }

    protected evaluateProps()
    {
        const props = this.props;

        props.referrer = props.referrer || parseUrlParameter("referrer");
        props.mode = props.mode || parseUrlParameter("mode") || "prep";
        props.expert = props.expert !== undefined ? props.expert : parseUrlParameter("expert") !== "false";

        const story = this.system.components.get(CVStoryController);
        story.ins.referrer.setValue(props.referrer);
        story.ins.expertMode.setValue(!!props.expert);

        this.explorer.evaluateProps();
    }
}

window["VoyagerStory"] = StoryApplication;