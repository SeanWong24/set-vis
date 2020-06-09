import { Component, Host, h, Element, Prop, State } from '@stencil/core';
import 's-vis';
import { ParallelSetsDataNode } from 's-vis/dist/types/components/s-parallel-sets/utils';
import * as d3 from 'd3';

@Component({
  tag: 's-set-vis',
  styleUrl: 's-set-vis.css',
  shadow: true,
})
export class SSetVis {

  @Element() hostElement: HTMLElement;

  @State() hostElementBoundingClientRect: DOMRect;
  @State() parallelSetsDimensionNodeListMap: Map<string, ParallelSetsDataNode[]>;

  @Prop() data: any[] = [];
  @Prop() parallelSetsRibbonTension: number = 1;
  @Prop({ mutable: true }) parallelSetsDimensions: string[];
  @Prop() parallelSetsColorScheme: string[] = [...d3.schemeAccent];
  @Prop() statisticsPlotGroupDefinitions: { dimensionName: string, visType: string }[];

  connectedCallback() {
    const resizeObserver = new ResizeObserver(entryList => {
      for (const entry of entryList) {
        if (entry.target === this.hostElement) {
          this.hostElementBoundingClientRect = entry.target.getBoundingClientRect();
        }
      }
    });
    resizeObserver.observe(this.hostElement);
  }

  render() {
    return (
      <Host>
        <s-parallel-sets
          data={this.data}
          dimensions={this.parallelSetsDimensions}
          colorScheme={this.parallelSetsColorScheme}
          ribbonTension={this.parallelSetsRibbonTension}
          maxSegmentLimit={5}
          mergedSegmentMaxRatio={.1}
          onVisLoaded={({ detail }) => this.parallelSetsLoadedHandler(detail)}
          onAxisHeaderClick={({ detail: dimensionName }) => {
            const currentDimensionIndex = this.parallelSetsDimensions.findIndex(value => value === dimensionName);
            this.swapItems(this.parallelSetsDimensions, currentDimensionIndex, currentDimensionIndex - 1);
            this.parallelSetsDimensions = [...this.parallelSetsDimensions];
          }}
          onAxisHeaderContextMenu={({ detail: dimensionName }) => {
            const currentDimensionIndex = this.parallelSetsDimensions.findIndex(value => value === dimensionName);
            this.swapItems(this.parallelSetsDimensions, currentDimensionIndex, currentDimensionIndex + 1);
            this.parallelSetsDimensions = [...this.parallelSetsDimensions];
          }}
        ></s-parallel-sets>
        <div id="statistics-plot-group-container">
          {
            this.parallelSetsDimensionNodeListMap &&
            this.statisticsPlotGroupDefinitions?.map(definition => (
              <s-statistics-plot-group
                dimensionName={definition.dimensionName}
                data={this.data}
                visType={definition.visType}
                parallelSetsDimensionNodeListMap={this.parallelSetsDimensionNodeListMap}
                parallelSetsColorScheme={this.parallelSetsColorScheme}
              ></s-statistics-plot-group>
            ))
          }
        </div>
      </Host >
    );
  }

  private parallelSetsLoadedHandler(dimensionNodeListMap: Map<string, ParallelSetsDataNode[]>) {
    this.parallelSetsDimensionNodeListMap = dimensionNodeListMap;
  }

  private swapItems(list: any[], index1: number, index2: number) {
    if (index1 >= 0 && index1 < list.length && index2 >= 0 && index2 < list.length) {
      list[index1] = list.splice(index2, 1, list[index1])[0];
    }
  }

}
