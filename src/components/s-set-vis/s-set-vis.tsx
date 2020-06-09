import { Component, Host, h, Element, Prop, State } from '@stencil/core';
import 's-vis';
import { ParallelSetsDataNode } from 's-vis/dist/types/components/s-parallel-sets/utils';

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
  @Prop() parallelSetsDimensions: string[];
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
          ribbonTension={this.parallelSetsRibbonTension}
          maxSegmentLimit={5}
          mergedSegmentMaxRatio={.1}
          onVisLoaded={({ detail }) => this.parallelSetsLoadedHandler(detail)}
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

}
