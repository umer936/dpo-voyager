/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

import CFullscreen from "@ff/scene/components/CFullscreen";
import CVARManager from "client/components/CVARManager";
import CVViewer from "client/components/CVViewer";

import CustomElement, { customElement, html } from "@ff/ui/CustomElement";

import Icon from "@ff/ui/Icon";
import Notification from "@ff/ui/Notification";

import ExplorerApplication, { IExplorerApplicationProps } from "../../applications/ExplorerApplication";

import ContentView from "./ContentView";
import ChromeView from "./ChromeView";

import styles from "./styles.scss";

////////////////////////////////////////////////////////////////////////////////
// EXPLORER ICONS

Icon.add("globe", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z"/></svg>`);
Icon.add("cog", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"/></svg>`);
Icon.add("eye", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M569.354 231.631C512.969 135.949 407.81 72 288 72 168.14 72 63.004 135.994 6.646 231.631a47.999 47.999 0 0 0 0 48.739C63.031 376.051 168.19 440 288 440c119.86 0 224.996-63.994 281.354-159.631a47.997 47.997 0 0 0 0-48.738zM288 392c-75.162 0-136-60.827-136-136 0-75.162 60.826-136 136-136 75.162 0 136 60.826 136 136 0 75.162-60.826 136-136 136zm104-136c0 57.438-46.562 104-104 104s-104-46.562-104-104c0-17.708 4.431-34.379 12.236-48.973l-.001.032c0 23.651 19.173 42.823 42.824 42.823s42.824-19.173 42.824-42.823c0-23.651-19.173-42.824-42.824-42.824l-.032.001C253.621 156.431 270.292 152 288 152c57.438 0 104 46.562 104 104z"/></svg>`);
Icon.add("palette", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M128 224c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.4-32-32-32zM418.6 58.1C359.2 9.3 281.3-10 204.6 5 104.9 24.4 24.7 104.2 5.1 203.7c-16.7 84.2 8.1 168.3 67.8 230.6 47.3 49.4 109.7 77.8 167.9 77.8 8.8 0 17.5-.6 26.1-2 24.2-3.7 44.6-18.7 56.1-41.1 12.3-24 12.3-52.7.2-76.6-6.1-12-5.5-26.2 1.8-38 7-11.8 18.7-18.4 32-18.4h72.2c46.4 0 82.8-35.7 82.8-81.3-.2-76.4-34.3-148.1-93.4-196.6zM429.2 288H357c-29.9 0-57.2 15.4-73 41.3-16 26.1-17.3 57.8-3.6 84.9 5.1 10.1 5.1 22.7-.2 32.9-2.6 5-8.7 13.7-20.6 15.6-49.3 7.7-108.9-16.6-152-61.6-48.8-50.9-69-119.4-55.4-188 15.9-80.6 80.8-145.3 161.6-161 62.6-12.3 126.1 3.5 174.3 43.1 48.1 39.5 75.7 97.6 75.9 159.6 0 18.6-15.3 33.2-34.8 33.2zM160 128c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.4-32-32-32zm96-32.1c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32c0-17.6-14.3-32-32-32zm96 32.1c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z"/></svg>`);
Icon.add("comment", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32z"/></svg>`);
//Icon.add("information", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M84.06,204.23h24.07V138.77H93.06A9.06,9.06,0,0,1,84,129.71V108.06A9.06,9.06,0,0,1,93.06,99h56.75a9.07,9.07,0,0,1,9.07,9.06v96.17h24.06a9.06,9.06,0,0,1,9.06,9.06v21.65a9.06,9.06,0,0,1-9.06,9.06H84.06A9.06,9.06,0,0,1,75,234.94V213.29A9.06,9.06,0,0,1,84.06,204.23ZM133.5,12a32.63,32.63,0,1,0,32.63,32.63A32.62,32.62,0,0,0,133.5,12Z"/></svg>`);
Icon.add("article", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"/></svg>`);
Icon.add("document", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M288 248v28c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-28c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm-12 72H108c-6.6 0-12 5.4-12 12v28c0 6.6 5.4 12 12 12h168c6.6 0 12-5.4 12-12v-28c0-6.6-5.4-12-12-12zm108-188.1V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V48C0 21.5 21.5 0 48 0h204.1C264.8 0 277 5.1 286 14.1L369.9 98c9 8.9 14.1 21.2 14.1 33.9zm-128-80V128h76.1L256 51.9zM336 464V176H232c-13.3 0-24-10.7-24-24V48H48v416h288z"/></svg>`);
Icon.add("share", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z"/></svg>`);
Icon.add("expand", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M241,29V141.53a14,14,0,0,1-14,14h-18.7a14,14,0,0,1-14-14V61.74H114.45a14,14,0,0,1-14-14L100.3,29a14,14,0,0,1,14-14H226.89A14,14,0,0,1,241,29Z"/><path class="cls-1" d="M15,226.67V114.11a14,14,0,0,1,14-14h18.7a14,14,0,0,1,14,14V193.9h79.79a14,14,0,0,1,14,14l.12,18.74a14,14,0,0,1-14,14H29.07A14,14,0,0,1,15,226.67Z"/></svg>`);
Icon.add("zoom", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z"/></svg>`);
Icon.add("tools", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M501.1 395.7L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7zM331.7 225c28.3 0 54.9 11 74.9 31l19.4 19.4c15.8-6.9 30.8-16.5 43.8-29.5 37.1-37.1 49.7-89.3 37.9-136.7-2.2-9-13.5-12.1-20.1-5.5l-74.4 74.4-67.9-11.3L334 98.9l74.4-74.4c6.6-6.6 3.4-17.9-5.7-20.2-47.4-11.7-99.6.9-136.6 37.9-28.5 28.5-41.9 66.1-41.2 103.6l82.1 82.1c8.1-1.9 16.5-2.9 24.7-2.9zm-103.9 82l-56.7-56.7L18.7 402.8c-25 25-25 65.5 0 90.5s65.5 25 90.5 0l123.6-123.6c-7.6-19.9-9.9-41.6-5-62.7zM64 472c-13.2 0-24-10.8-24-24 0-13.3 10.7-24 24-24s24 10.7 24 24c0 13.2-10.7 24-24 24z"/></svg>`);
Icon.add("environment", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M219.81,14.75H36.19A21.19,21.19,0,0,0,15,35.94V220.06a21.19,21.19,0,0,0,21.19,21.19H219.81A21.19,21.19,0,0,0,241,220.06V35.94A21.19,21.19,0,0,0,219.81,14.75Zm-2.65,205.31H38.84a2.64,2.64,0,0,1-2.65-2.65V38.59a2.64,2.64,0,0,1,2.65-2.65H217.16a2.64,2.64,0,0,1,2.65,2.65V217.41A2.64,2.64,0,0,1,217.16,220.06ZM72.16,71.59A18.32,18.32,0,1,0,90.47,89.91,18.32,18.32,0,0,0,72.16,71.59ZM57.51,198.15H204V141.53l-40.06-40.06a5.49,5.49,0,0,0-7.77,0l-54.72,54.71L83.36,138.09a5.47,5.47,0,0,0-7.76,0L57.51,156.18Z"/></svg>`);
Icon.add("bulb", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M44.73 323.21c-7.65 4.42-10.28 14.2-5.86 21.86l8 13.86c4.42 7.65 14.21 10.28 21.86 5.86l93.26-53.84a207.865 207.865 0 0 1-26.83-39.93l-90.43 52.19zM112.46 168H16c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h100.21a210.423 210.423 0 0 1-3.75-48zm127.6 291.17c0 3.15.93 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84l.05-43.18H240.02l.04 43.18zM44.73 60.78l78.98 45.6c5.37-15.29 12.97-29.48 21.64-42.93L68.73 19.21c-7.65-4.42-17.44-1.8-21.86 5.86l-8 13.86c-4.42 7.65-1.79 17.44 5.86 21.85zm550.54 0c7.65-4.42 10.28-14.2 5.86-21.86l-8-13.86c-4.42-7.65-14.21-10.28-21.86-5.86l-76.61 44.23c8.68 13.41 15.76 27.9 21.2 43.19l79.41-45.84zm0 262.43l-90.97-52.52c-7.33 14.23-15.8 27.88-26.36 40.21l93.33 53.88c7.65 4.42 17.44 1.8 21.86-5.86l8-13.86c4.42-7.64 1.79-17.43-5.86-21.85zM624 168h-96.41c.1 2.68.41 5.3.41 8 0 13.54-1.55 26.89-4.12 40H624c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zM320 80c-52.94 0-96 43.06-96 96 0 8.84 7.16 16 16 16s16-7.16 16-16c0-35.3 28.72-64 64-64 8.84 0 16-7.16 16-16s-7.16-16-16-16zm0-80C217.72 0 144 82.97 144 176c0 44.37 16.45 84.85 43.56 115.78 16.64 18.99 42.74 58.8 52.42 92.16v.06h48v-.12c-.01-4.77-.72-9.51-2.15-14.07-5.59-17.81-22.82-64.77-62.17-109.67-20.53-23.43-31.52-53.14-31.61-84.14-.2-73.64 59.67-128 127.95-128 70.58 0 128 57.42 128 128 0 30.97-11.24 60.85-31.65 84.14-39.11 44.61-56.42 91.47-62.1 109.46a47.507 47.507 0 0 0-2.22 14.3v.1h48v-.05c9.68-33.37 35.78-73.18 52.42-92.16C479.55 260.85 496 220.37 496 176 496 78.8 417.2 0 320 0z"/></svg>`);
Icon.add("tape", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M624 432H362.3c52.1-41 85.7-104.5 85.7-176 0-123.7-100.3-224-224-224S0 132.3 0 256s100.3 224 224 224h400c8.8 0 16-7.2 16-16v-16c0-8.8-7.2-16-16-16zm-400 0c-97 0-176-79-176-176S127 80 224 80s176 79 176 176-79 176-176 176zm0-272c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 144c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z"/></svg>`);
Icon.add("knife", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M566.28 88.57c12.96-12.5 12.96-32.76 0-45.25L531.07 9.37c-12.96-12.5-33.98-12.5-46.94 0L319.99 160 4.76 464.14c-8.25 7.96-5.38 22.16 5.53 25.69C53.72 503.86 102.37 512 150.51 512c75.83 0 150.42-20.19 201.49-69.35l104.4-100.04c12.95-12.41 13.17-33.05.49-45.73L448 288v-80L566.28 88.57zM496 64c8.84 0 16 7.16 16 16s-7.16 16-16 16-16-7.16-16-16 7.16-16 16-16zM318.71 408.07C281.24 444.14 221.5 464 150.51 464c-23.16 0-46.79-2.1-70.07-6.17L319.4 227.28l91.99 91.99-92.68 88.8zM432 160c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.17 16-16 16z"/></svg>`);
Icon.add("bars", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/></svg>`);
Icon.add("triangle-left", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M191.33,31.38V224.62a15,15,0,0,1-25.64,10.62L69.07,138.62a15,15,0,0,1,0-21.24l96.62-96.62A15,15,0,0,1,191.33,31.38Z"/></svg>`);
Icon.add("triangle-right", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M64.67,224.62V31.38A15,15,0,0,1,90.31,20.76l96.62,96.62a15,15,0,0,1,0,21.24L90.31,235.24A15,15,0,0,1,64.67,224.62Z"/></svg>`);
Icon.add("twitter", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/></svg>`);
Icon.add("facebook", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 512"><path d="M76.7 512V283H0v-91h76.7v-71.7C76.7 42.4 124.3 0 193.8 0c33.3 0 61.9 2.5 70.2 3.6V85h-48.2c-37.8 0-45.1 18-45.1 44.3V192H256l-11.7 91h-73.6v229"/></svg>`);
Icon.add("instagram", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>`);
Icon.add("linkedin", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448.1 512"><path d="M100.3 448H7.4V148.9h92.9V448zM53.8 108.1C24.1 108.1 0 83.5 0 53.8S24.1 0 53.8 0s53.8 24.1 53.8 53.8-24.1 54.3-53.8 54.3zM448 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448h-.1z"/></svg>`);
Icon.add("email", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"/></svg>`);
Icon.add("copy", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM266 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h74v224c0 26.51 21.49 48 48 48h96v42a6 6 0 0 1-6 6zm128-96H182a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h106v88c0 13.255 10.745 24 24 24h88v202a6 6 0 0 1-6 6zm6-256h-64V48h9.632c1.591 0 3.117.632 4.243 1.757l48.368 48.368a6 6 0 0 1 1.757 4.243V112z"/></svg>`);
Icon.add("ar", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.844874 7.2009368"><path d="M 4.1805699,5.4542117 H 2.4801904 L 2.2118585,6.5168507 H 1.1187593 L 2.6807334,0.68408928 h 1.296469 L 5.5391781,6.5168507 H 4.4460774 Z M 2.7513476,4.3720517 H 3.9065883 L 3.3303802,2.0514503 Z"/><path d="m 7.5355365,3.2703464 q 0.3417706,0 0.4886463,-0.1758024 0.1497018,-0.1758024 0.1497018,-0.5781942 0,-0.3984876 -0.1497018,-0.5703858 Q 7.8773071,1.7740658 7.5355365,1.7740658 H 7.0779585 V 3.2703464 Z M 7.0779585,4.309544 V 6.5168507 H 5.9905084 V 0.68408928 h 1.6608338 q 0.8332429,0 1.220205,0.38676692 0.3897887,0.3867669 0.3897887,1.2228084 0,0.5781942 -0.2033672,0.9493362 -0.200543,0.371142 -0.607278,0.5469444 0.2231388,0.070308 0.3982608,0.320355 0.1779472,0.2461266 0.358719,0.7500924 L 9.7980008,6.5168507 H 8.6399351 L 8.1258661,5.0674448 Q 7.970517,4.6298909 7.8095182,4.4697134 7.6513422,4.309544 7.3858347,4.309544 Z"/></svg>`);
Icon.add("device-move", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.4 57.7"><path d="M47.4,20.7h-34c-0.2,0-0.4-0.1-0.5-0.3l-0.1-0.2l0.1-0.3l9-19.5C21.9,0.2,22.1,0,22.3,0h24.5v1H22.6L14,19.7h33.4V20.7z"/><path d="M103,20.7H71v-1h31.6L95,1H46.8V0h48.3c0.3,0,0.6,0.2,0.7,0.5l7.8,19.2c0.1,0.2,0.1,0.5-0.1,0.7C103.5,20.6,103.2,20.7,103,20.7z M94.9,0.9L94.9,0.9z"/><path d="M49,2.9c-1.1,0-2,0.9-2,2v40c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2v-40c0-1.1-0.9-2-2-2L49,2.9z M49,3.9h3.6l0,0h0l0,0l0,0l0,0l0,0l0,0v0l0,0l0,0l0,0l0,0v0.5c0,0.6,0.4,1,1,1H64c0.6,0,1-0.4,1-1v0l0,0V4.3c0,0,0,0,0-0.1l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0h4c0.6,0,1,0.4,1,1v40c0,0.6-0.4,1-1,1H49c-0.6,0-1-0.4-1-1l0-40.2c0.1-0.5,0-0.8,0.4-1.1C48.5,4,48.8,3.9,49,3.9z"/><path d="M53.3,43.9h11.5c0.3,0,0.6,0.2,0.6,0.5c0,0.3-0.3,0.5-0.6,0.5H53.3c-0.3,0-0.6-0.2-0.6-0.5C52.7,44.1,53,43.8,53.3,43.9z"/><path d="M76,37.8c-0.7,0-1.3,0-2-0.1l0.1-1c1.6,0.2,10,0.7,15.7-5.5c1.8-2,3.1-4.4,3.8-7l1,0.3c-0.7,2.8-2.1,5.3-4,7.5C85.8,37,79.3,37.8,76,37.8z"/><polygon points="96.9,28.6 96,29 93.8,24.6 89.5,27.1 89,26.2 94.3,23.2"/><path d="M42.1,37.4c-3.4,0-9.9-0.8-14.5-6c-1.9-2.1-3.3-4.7-4-7.5l1-0.3c0.7,2.6,1.9,5,3.7,7.1c5.6,6.3,14,5.7,15.7,5.5l0.1,1C43.4,37.4,42.8,37.4,42.1,37.4z"/><polygon points="29,25.8 28.5,26.6 24.3,24.2 22.1,28.6 21.2,28.2 23.8,22.8"/></svg>`);
Icon.add("audio", html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 85 300 275"><path d="M144.800 88.415 C 105.869 89.675,75.661 108.730,58.580 142.800 C 42.479 174.915,49.153 218.126,74.086 243.200 C 82.194 251.354,81.622 247.747,81.571 290.400 C 81.526 327.954,81.532 328.075,83.579 331.303 C 85.932 335.013,81.918 334.725,133.200 334.853 L 178.200 334.965 180.317 334.026 C 184.940 331.975,186.179 329.159,187.004 318.834 C 187.966 306.788,188.179 306.609,201.600 306.579 C 223.132 306.529,231.384 304.069,239.712 295.216 C 246.448 288.055,247.778 282.132,247.527 260.400 C 247.353 245.306,247.496 245.061,256.908 244.337 C 272.369 243.147,279.383 238.170,279.366 228.400 C 279.356 222.955,278.475 220.120,267.737 191.000 C 266.520 187.700,263.126 177.980,260.196 169.400 C 249.024 136.687,242.930 126.187,227.400 112.880 C 209.769 97.774,189.461 89.600,166.600 88.407 C 158.610 87.991,157.887 87.991,144.800 88.415 M205.416 171.240 C 218.099 175.986,216.908 195.403,203.667 199.781 C 192.504 203.472,180.685 190.157,185.674 179.509 C 189.403 171.550,197.349 168.222,205.416 171.240 M311.000 220.715 C 304.366 224.871,305.398 229.213,315.511 239.699 C 325.906 250.478,330.441 259.997,334.191 278.909 C 338.184 299.050,330.538 322.088,313.936 339.938 C 307.475 346.885,307.028 347.548,307.030 350.184 C 307.038 359.089,317.896 358.672,326.406 349.440 C 353.041 320.544,357.609 275.463,337.176 243.154 C 326.661 226.527,316.131 217.500,311.000 220.715 M291.392 243.932 C 286.465 247.613,286.911 251.389,293.068 258.095 C 310.600 277.194,310.622 300.169,293.125 319.139 C 287.742 324.975,286.682 328.672,289.377 332.205 C 294.000 338.266,301.447 335.014,309.224 323.540 C 324.531 300.956,324.654 275.911,309.565 254.525 C 302.386 244.350,295.897 240.567,291.392 243.932 M272.664 267.012 C 268.192 270.357,268.344 272.961,273.453 280.549 C 278.010 287.318,277.882 290.657,272.777 298.232 C 267.556 305.977,269.217 312.622,276.361 312.571 C 288.218 312.486,295.338 289.895,288.227 274.922 C 284.588 267.259,277.292 263.551,272.664 267.012 " fill-rule="evenodd"></path></svg>`);
//Icon.add("name", html``);

////////////////////////////////////////////////////////////////////////////////

/**
 * Main UI view for the Voyager Explorer application.
 */
@customElement("voyager-explorer")
export default class MainView extends CustomElement
{
    application: ExplorerApplication = null;

    static get observedAttributes() { return ['root']; }

    constructor(application?: ExplorerApplication)
    {
        super();

        if (application) {
            this.application = application;
        }

        this.addEventListener('focus', this.onFocus);
    }

    protected get fullscreen() {
        return this.application.system.getMainComponent(CFullscreen);
    }
    protected get arManager() {
        return this.application.system.getMainComponent(CVARManager);
    }
    protected get viewer() {
        return this.application.system.getComponent(CVViewer);
    }

    protected firstConnected()
    {
        super.firstConnected();

        if (!this.application) {
            const props: IExplorerApplicationProps = {
                root: this.getAttribute("root"),
                dracoRoot: this.getAttribute("dracoRoot"),
                resourceRoot: this.getAttribute("resourceRoot"),
                document: this.getAttribute("document"),
                model: this.getAttribute("model"),
                geometry: this.getAttribute("geometry"),
                texture: this.getAttribute("texture"),
                quality: this.getAttribute("quality"),
                uiMode: this.getAttribute("uiMode"),
                uiStyle: this.getAttribute("uiStyle"),
                bgColor: this.getAttribute("bgColor"),
                bgStyle: this.getAttribute("bgStyle"),
                controls: this.getAttribute("controls"),
                reader: this.getAttribute("reader"),
                readerPosition: this.getAttribute("reader-position"),
                lang: this.getAttribute("lang")
            };

            this.application = new ExplorerApplication(null, props);
        }

        this.attachShadow({mode: 'open'});
        const shadowRoot = this.shadowRoot;

        this.arManager.shadowRoot = shadowRoot;

        // add style
        var styleElement = document.createElement("style");
        styleElement.innerText = styles;
        shadowRoot.appendChild(styleElement);

        const system = this.application.system;
        shadowRoot.appendChild(new ContentView(system));
        shadowRoot.appendChild(new ChromeView(system));

        const notifications = document.createElement("div");
        notifications.setAttribute("id", Notification.stackId);
        shadowRoot.appendChild(notifications);
        Notification.shadowRootNode = shadowRoot;

        //this.setAttribute("tabindex", "0");
        const introAnnouncement = document.createElement("div");
        introAnnouncement.classList.add("sr-only");
        introAnnouncement.setAttribute("id", "sr-intro");
        introAnnouncement.setAttribute("aria-live", "polite");
        shadowRoot.appendChild(introAnnouncement);
    }

    protected connected()
    {
        this.fullscreen.fullscreenElement = this;
        this.viewer.rootElement = this;
    }

    protected disconnected()
    {
        this.fullscreen.fullscreenElement = null;
        this.viewer.rootElement = null;
        this.application.dispose();
        this.application = null;
    }

    attributeChangedCallback(name: string, old: string | null, value: string | null)
    {
        super.attributeChangedCallback(name, old, value);

        if(this.application && name === "root") {
            this.application.props.root = this.getAttribute("root");
            this.application.evaluateProps();
        }
        else if(this.application && name === "controls") {
            this.application.enableNavigation(value);
        }
    }

    protected onFocus()
    {
        this.shadowRoot.getElementById("sr-intro").innerText =
            "The Voyager web application allows you to view "
            + "and interact with a 3D model from the Smithsonian collection. Use the tab key to "
            + "move through interactive elements, enter or spacebar keys to activate, and the escape key to exit menus.";
    }


    //** Pass-through for API functions so they can be called from the main component element */
    toggleAnnotations()
    {
        if(this.application) {
            this.application.toggleAnnotations();
        }
    }

    toggleReader()
    {
        if(this.application) {
            this.application.toggleReader();
        }
    }

    toggleTours()
    {
        if(this.application) {
            this.application.toggleTours();
        }
    }

    toggleTools()
    {
        if(this.application) {
            this.application.toggleTools();
        }
    }

    toggleMeasurement()
    {
        if(this.application) {
            this.application.toggleMeasurement();
        }
    }
    
    enableAR()
    {
        if(this.application) {
            this.application.enableAR();
        }
    }

    getArticles()
    {
        if(this.application) {
            const articles = this.application.getArticles();
            return articles;
        }
    }

    getAnnotations()
    {
        if(this.application) {
            const annotations = this.application.getAnnotations();
            return annotations;
        }
    }

    getCameraOrbit(type?: string)
    {
        if(this.application) {
            const orbit = this.application.getCameraOrbit(type ? type : null);
            return orbit;
        }
    }

    setCameraOrbit( yaw: string, pitch: string)
    {
        if(this.application) {
            this.application.setCameraOrbit(yaw, pitch);
        }
    }

    getCameraOffset(type?: string)
    {
        if(this.application) {
            const offset = this.application.getCameraOffset(type ? type : null);
            return offset;
        }
    }

    setCameraOffset( x: string, y: string, z: string)
    {
        if(this.application) {
            this.application.setCameraOffset(x, y, z);
        }
    }

    setBackgroundColor(color0: string, color1?: string)
    {
        if(this.application) {
            this.application.setBackgroundColor(color0, color1 ? color1 : null);
        }
    }

    setBackgroundStyle(style: string)
    {
        if(this.application) {
            this.application.setBackgroundStyle(style);
        }
    }

    setActiveAnnotation(id: string)
    {
        if(this.application) {
            this.viewer.ins.activeAnnotation.setValue(id);
        }
    }

    setTourStep(tourIdx: string, stepIdx: string, interpolate?: boolean)
    {
        if(this.application) {
            this.application.setTourStep(tourIdx, stepIdx, interpolate !== undefined ? interpolate : true);
        }
    }

    setLanguage(languageID: string)
    {
        if(this.application) {
            this.application.setLanguage(languageID);
        }
    }
}