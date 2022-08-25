import { Viewport } from "pixi-viewport"
import { Container } from "pixi.js"
import { MapName } from "alclient"

export type GeoMaps = Exclude<MapName, "batcave" | "d1" | "d2" | "d3" | "frozencave" | "maintest" | "old_bank" | "old_main" | "original_main" | "therush">

export type Layers = {
    background: Container
    foreground: Container
    hpBars: Container
    viewport: Viewport
}