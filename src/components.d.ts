/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { ParallelSetsDataNode, } from "s-vis/dist/types/components/s-parallel-sets/utils";
export namespace Components {
    interface SSetVis {
        "data": any[];
        "parallelSetsColorScheme": string[];
        "parallelSetsDimensions": string[];
        "parallelSetsMaxSegmentLimit": number | number[];
        "parallelSetsMergedSegmentName": string;
        "parallelSetsRibbonTension": number;
        "statisticsPlotGroupDefinitions": {
            dimensionName: string;
            visType: string;
        }[];
    }
    interface SStatisticsPlotGroup {
        "data": any[];
        "dimensionName": string;
        "headerTextSize": number;
        "isSelected": boolean;
        "parallelSetsColorScheme": string[];
        "parallelSetsDimensionNodeListMap": Map<string, ParallelSetsDataNode[]>;
        "visType": string;
    }
}
declare global {
    interface HTMLSSetVisElement extends Components.SSetVis, HTMLStencilElement {
    }
    var HTMLSSetVisElement: {
        prototype: HTMLSSetVisElement;
        new (): HTMLSSetVisElement;
    };
    interface HTMLSStatisticsPlotGroupElement extends Components.SStatisticsPlotGroup, HTMLStencilElement {
    }
    var HTMLSStatisticsPlotGroupElement: {
        prototype: HTMLSStatisticsPlotGroupElement;
        new (): HTMLSStatisticsPlotGroupElement;
    };
    interface HTMLElementTagNameMap {
        "s-set-vis": HTMLSSetVisElement;
        "s-statistics-plot-group": HTMLSStatisticsPlotGroupElement;
    }
}
declare namespace LocalJSX {
    interface SSetVis {
        "data"?: any[];
        "parallelSetsColorScheme"?: string[];
        "parallelSetsDimensions"?: string[];
        "parallelSetsMaxSegmentLimit"?: number | number[];
        "parallelSetsMergedSegmentName"?: string;
        "parallelSetsRibbonTension"?: number;
        "statisticsPlotGroupDefinitions"?: {
            dimensionName: string;
            visType: string;
        }[];
    }
    interface SStatisticsPlotGroup {
        "data"?: any[];
        "dimensionName"?: string;
        "headerTextSize"?: number;
        "isSelected"?: boolean;
        "onHeaderClick"?: (event: CustomEvent<string>) => void;
        "parallelSetsColorScheme"?: string[];
        "parallelSetsDimensionNodeListMap"?: Map<string, ParallelSetsDataNode[]>;
        "visType"?: string;
    }
    interface IntrinsicElements {
        "s-set-vis": SSetVis;
        "s-statistics-plot-group": SStatisticsPlotGroup;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "s-set-vis": LocalJSX.SSetVis & JSXBase.HTMLAttributes<HTMLSSetVisElement>;
            "s-statistics-plot-group": LocalJSX.SStatisticsPlotGroup & JSXBase.HTMLAttributes<HTMLSStatisticsPlotGroupElement>;
        }
    }
}
