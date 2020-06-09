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
  @State() parallelSetsLastDimensionSortBy: string;

  @Prop() data: any[] = [];
  @Prop() parallelSetsRibbonTension: number = 1;
  @Prop({ mutable: true }) parallelSetsDimensions: string[];
  @Prop() parallelSetsMaxSegmentLimit: number | number[] = 10;
  @Prop() parallelSetsMergedSegmentName: string = '*Other*';
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
    const parallelSetsDimensionValuesMap = this.generateDimensionValuesMap();

    return (
      <Host>
        <s-parallel-sets
          data={this.data}
          dimensions={this.parallelSetsDimensions}
          dimensionValuesMap={parallelSetsDimensionValuesMap}
          colorScheme={this.parallelSetsColorScheme}
          ribbonTension={this.parallelSetsRibbonTension}
          maxSegmentLimit={this.parallelSetsMaxSegmentLimit}
          mergedSegmentName={this.parallelSetsMergedSegmentName}
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
                onHeaderClick={({ detail }) => { this.parallelSetsLastDimensionSortBy = this.parallelSetsLastDimensionSortBy === detail ? undefined : detail }}
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

  private generateDimensionValuesMap() {
    const dimensionValuesMapEntryList = this.parallelSetsDimensions.map((dimensionName, i) => {
      let sortedValueList;
      if (i === this.parallelSetsDimensions.length - 1 && this.parallelSetsLastDimensionSortBy) {
        const valueDataRecordListMap = new Map<string | number, any[]>();
        for (const dataRecord of this.data) {
          const currentValue = dataRecord[dimensionName];
          let dataRecordListForCurrentValue = valueDataRecordListMap.get(currentValue);
          if (!dataRecordListForCurrentValue) {
            valueDataRecordListMap.set(currentValue, dataRecordListForCurrentValue = []);
          }
          dataRecordListForCurrentValue.push(dataRecord);
        }
        sortedValueList = [...valueDataRecordListMap]
          .map(([value, dataRecordList]) => [
            value,
            d3.mean(dataRecordList.map(dataRecord => +dataRecord[this.parallelSetsLastDimensionSortBy]))
          ] as [string | number, number])
          .sort(([_, a], [__, b]) => b - a)
          .map(([value]) => value);
      }
      const currentDimensionValueList = sortedValueList ||
        [...new Set(this.data.map(dataRecord => dataRecord[dimensionName]))]
          .sort((a, b) => {
            switch (typeof a) {
              case 'number':
                return a - (b as number);
              case 'string':
                return this.compareStrings(a, b as string);
            }
          });
      return [dimensionName, currentDimensionValueList] as [string, (string | number)[]];
    });

    for (let i = 0; i < dimensionValuesMapEntryList.length; i++) {
      const dimensionValuesMapEntry = dimensionValuesMapEntryList[i];
      const maxSegmentLimit = this.parallelSetsMaxSegmentLimit[i] || this.parallelSetsMaxSegmentLimit;
      if (dimensionValuesMapEntry[1].length > maxSegmentLimit) {
        dimensionValuesMapEntry[1].splice(maxSegmentLimit);
        dimensionValuesMapEntry[1].push(this.parallelSetsMergedSegmentName);
      }
    }
    const dimensionValuesMap = new Map(dimensionValuesMapEntryList);
    return dimensionValuesMap;
  }

  private compareStrings(a: string, b: string) {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1
    } else {
      return 0;
    }
  }

}
