import { Component, ComponentInterface, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ParallelSetsDataNode } from '../s-parallel-sets/utils';
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
  @Prop() isSelected: boolean = false;

  @Event() headerClick: EventEmitter<string>;
  @Event() rowClick: EventEmitter<string | number>;

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
    const colorScale = d3.scaleOrdinal(this.parallelSetsColorScheme)
      .domain(parallelSetsDimensionNodeListMapEntryList[0][1].map(node => node.valueHistory[0].toString()));;

    return (
      <Host>
        <text
          id="header"
          style={{
            fontSize: `${this.headerTextSize}px`,
            height: `${this.headerTextSize}px`,
            cursor: 'pointer',
            color: this.isSelected ? 'red' : 'black'
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
                  parallelSetsFirstDimensionValueCountMap.set(value, node.dataRecordList.length);
                }
              }
              const totalCount = [...parallelSetsFirstDimensionValueCountMap].reduce((result, [_, value]) => result + value, 0);
              let newMap = [...parallelSetsFirstDimensionValueCountMap].reduce((map, [key, value]) => (map.set(key, value / totalCount * 100), map), new Map<string | number, number>());
              debugger
              newMap = new Map([...newMap].map(([key, value], i, entries) => ([key, i === 0 ? value / 2 : value + (entries[i - 1]?.[1] || 0)])));
              const largestRatioValueOnParallelSetsFirstDimension = [...parallelSetsFirstDimensionValueCountMap].sort(([_, a], [__, b]) => b - a)[0][0];

              return (
                <div
                  class="plot-item-container"
                  style={{
                    top: `${minSegmentPosition * 100}%`,
                    height: `${(maxSegmentPosition - minSegmentPosition) * 100}%`
                  }}
                  onClick={() => this.rowClick.emit(nodeList?.[0].valueHistory[nodeList?.[0].valueHistory.length - 1])}
                >
                  <div
                    class="plot-item-background"
                    style={{
                      backgroundColor: colorScale(largestRatioValueOnParallelSetsFirstDimension.toString()),
                      backgroundImage: `linear-gradient(to right, ${[...newMap].map(([key, value]) => `${colorScale(key.toString())} ${value}%`).join(', ')})`
                    }}
                  ></div>
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
