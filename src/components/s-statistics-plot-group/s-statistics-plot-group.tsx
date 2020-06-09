import { Component, ComponentInterface, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ParallelSetsDataNode } from 's-vis/dist/types/components/s-parallel-sets/utils';
import 's-vis';
import * as d3 from 'd3';

@Component({
  tag: 's-statistics-plot-group',
  styleUrl: 's-statistics-plot-group.css',
  shadow: true,
})
export class SStatisticsPlotGroup implements ComponentInterface {

  @Prop() dimensionName: string;
  @Prop() data: any[];
  @Prop() visType: string;
  @Prop() parallelSetsDimensionNodeListMap: Map<string, ParallelSetsDataNode[]>;
  @Prop() parallelSetsColorScheme: string[];
  @Prop() headerTextSize: number = 16;

  @Event() headerClick: EventEmitter<string>;

  render() {
    const parallelSetsDimensionNodeListMapEntryList = [...this.parallelSetsDimensionNodeListMap];
    const parallelSetsLastDimensionIndex = parallelSetsDimensionNodeListMapEntryList.length - 1;
    const parallelSetsLastDimensionNodeList =
      parallelSetsDimensionNodeListMapEntryList[parallelSetsLastDimensionIndex][1];
    const currentSegmentNodeListMap = new Map<string | number, ParallelSetsDataNode[]>();
    for (const node of parallelSetsLastDimensionNodeList) {
      const currentSegmentNodeList = currentSegmentNodeListMap.get(node.valueHistory[parallelSetsLastDimensionIndex]);
      if (currentSegmentNodeList) {
        currentSegmentNodeList.push(node);
      }
      else {
        currentSegmentNodeListMap.set(node.valueHistory[parallelSetsLastDimensionIndex], [node]);
      }
    }

    const allValues = this.data.map(record => record[this.dimensionName]);
    const colorScale = d3.scaleOrdinal(this.parallelSetsColorScheme);

    return (
      <Host>
        <text
          id="header"
          style={{
            fontSize: `${this.headerTextSize}px`,
            height: `${this.headerTextSize}px`,
            cursor: 'pointer'
          }}
          onClick={() => { this.headerClick.emit(this.dimensionName) }}
        >{this.dimensionName}</text>
        <div
          id="plot-group-container"
          style={{ height: `calc(100% - ${this.headerTextSize}px)` }}
        >
          {
            [...currentSegmentNodeListMap].map(([_, nodeList]) => {
              const values = nodeList.flatMap(node => node.dataRecordList.map(record => +record[this.dimensionName]));
              const minSegmentPosition = nodeList[0].adjustedSegmentPosition[0];
              const maxSegmentPosition = nodeList[nodeList.length - 1].adjustedSegmentPosition[1];

              const parallelSetsFirstDimensionValueCountMap = new Map<string | number, number>();
              for (const node of nodeList) {
                const value = node.valueHistory[0];
                const count = parallelSetsFirstDimensionValueCountMap.get(value);
                if (count) {
                  parallelSetsFirstDimensionValueCountMap.set(value, count + node.dataRecordList.length);
                } else {
                  parallelSetsFirstDimensionValueCountMap.set(value, 0);
                }
              }
              const largestRatioValueOnParallelSetsFirstDimension = [...parallelSetsFirstDimensionValueCountMap].sort(([_, a], [__, b]) => b - a)[0][0];

              return (
                <div
                  class="plot-item-container"
                  style={{
                    top: `${minSegmentPosition * 100}%`,
                    height: `${(maxSegmentPosition - minSegmentPosition) * 100}%`,
                    backgroundColor: colorScale(largestRatioValueOnParallelSetsFirstDimension.toString())
                  }}
                >
                  {this.renderPlotItem(allValues, values)}
                </div>
              );
            })
          }
        </div>
      </Host >
    );
  }

  private renderPlotItem(allValues: number[], values: number[]) {
    switch (this.visType) {
      case 'bar':
        const sortedAllValues = allValues.sort();
        const scaleMinValue = d3.quantile(sortedAllValues, .0);
        const scaleMaxFirstLevelValue = d3.quantile(sortedAllValues, .25);
        const scaleMaxSecondLevelValue = d3.quantile(sortedAllValues, .5);
        const scaleMaxThirdLevelValue = d3.quantile(sortedAllValues, .75);
        return (
          <s-bar
            class="plot-item"
            value={d3.mean(values)}
            minValue={scaleMinValue}
            maxValue={scaleMaxFirstLevelValue}
            secondLevelMaxValue={scaleMaxSecondLevelValue}
            thirdLevelMaxValue={scaleMaxThirdLevelValue}
          ></s-bar>
        );
      case 'box':
        return (
          <s-box
            class="plot-item"
            values={values}
            scaleMinValue={d3.min(allValues)}
            scaleMaxValue={d3.max(allValues)}
          ></s-box>
        );
    }
  }

}
