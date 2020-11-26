import { Component, ComponentInterface, Host, h, Prop, Element, State, Event, EventEmitter } from '@stencil/core';
import { ParallelSetsDataRecord, compareStrings, ParallelSetsDataNode } from './utils';
import * as d3 from 'd3';
import textures from 'textures';

@Component({
  tag: 's-parallel-sets',
  styleUrl: 's-parallel-sets.css',
  shadow: true,
})
export class SParallelSets implements ComponentInterface {

  private dimensionNameList: string[];
  private textureContainerElement: SVGElement;
  private textureMap: Map<string, any> = new Map();

  textures = textures;

  @Element() hostElement: HTMLElement;

  @State() hostElementBoundingClientRect: DOMRect;
  @State() contextMenu: any;

  @Prop() data: ParallelSetsDataRecord[] = [];
  @Prop() dimensions: string[];
  @Prop({ mutable: true }) dimensionValuesMap: Map<string, (string | number)[]>;
  @Prop() maxSegmentLimit: number | number[] = 10;
  @Prop() mergedSegmentName: string = '*Other*';
  @Prop() mergedSegmentMaxRatio: number = 1;
  @Prop() maxSegmentMarginRatioAllowed: number = .1;
  @Prop() colorScheme: string[] = [...d3.schemeAccent];
  @Prop() axisStrokeWidth: number = 2;
  @Prop() axisBoxWidth: number = 15;
  @Prop() axisBoxFill: string = 'rgb(100,100,100)';
  @Prop() axisHeaderTextColor: string = 'rgb(0,0,0)';
  @Prop() axisHeaderTextSize: number = 16;
  @Prop() axisHeaderTextWeight: string = 'bold';
  @Prop() axisSegmentTextColor: string = 'rgb(0,0,0)';
  @Prop() minimumRatioToShowAxisText: number = 0;
  @Prop() ribbonOpacity: number = .5;
  @Prop() ribbonHighlightOpacity: number = .8;
  @Prop() sideMargin: number = 2;
  @Prop() ribbonTension: number = 1;
  @Prop() useTextures: boolean = false;
  @Prop() textureDefinitions: string[];

  @Event() ribbonClick: EventEmitter<ParallelSetsDataNode>;
  @Event() axisHeaderClick: EventEmitter<string>;
  @Event() axisHeaderContextMenu: EventEmitter<string>;
  @Event() axisSegmentClick: EventEmitter<ParallelSetsDataNode[]>;
  @Event() visLoaded: EventEmitter<Map<string, ParallelSetsDataNode[]>>;

  connectedCallback() {
    const resizeObserver = new ResizeObserver(entryList => {
      for (const entry of entryList) {
        if (entry.target === this.hostElement) {
          this.hostElementBoundingClientRect = entry.target.getBoundingClientRect();
        }
      }
    });
    resizeObserver.observe(this.hostElement);

    window.addEventListener('click', () => this.contextMenu = undefined);
  }

  render() {
    this.dimensionNameList = (this.dimensions?.length > 0) ?
      this.dimensions : Object.keys((this.data || [{}])[0]);

    const dimensionValuesMap = this.dimensionValuesMap || this.generateDimensionValuesMap();
    const dimensionNodeListMap = this.generateDimensionNodeListMap(dimensionValuesMap);
    this.fillDataRecordListForDimensionNodeListMap(
      dimensionValuesMap,
      dimensionNodeListMap
    );
    this.removeEmptyDataRecordsForDimensionNodeListMap(dimensionNodeListMap);
    this.fillSegmentPositions(dimensionNodeListMap, dimensionValuesMap);

    const { width, height } = this.hostElementBoundingClientRect || {};
    const colorScale = d3.scaleOrdinal(this.colorScheme);
    const textureScale = d3.scaleOrdinal(this.textureDefinitions || [
      'this.textures.lines()',
      'this.textures.lines().heavier()',
      'this.textures.lines().lighter()',
      'this.textures.lines().thicker()',
      'this.textures.lines().thinner()',
      'this.textures.lines().orientation("vertical").strokeWidth(1).shapeRendering("crispEdges")',
      'this.textures.circles()',
      'this.textures.circles().heavier()',
      'this.textures.circles().lighter()',
      'this.textures.circles().thicker()',
      'this.textures.circles().thinner()',
      'this.textures.circles().complement()',
      'this.textures.circles().radius(4).fill("transparent").strokeWidth(2)'
    ]);

    return (
      <Host>
        {
          width && height && this.textureContainerElement &&
          <div
            id="main-container"
            ref={() => this.visLoaded.emit(dimensionNodeListMap)}
          >
            {this.contextMenu}
            <div id="axis-headers-container" style={{ height: this.axisHeaderTextSize + 'px' }}>
              {this.dimensionNameList.map((dimensionName, i) => (
                <text
                  class="axis-header-text"
                  style={{
                    position: 'absolute',
                    color: this.axisHeaderTextColor,
                    fontSize: this.axisHeaderTextSize + 'px',
                    fontWeight: this.axisHeaderTextWeight,
                    left: this.obtainDimensionPosition(width, this.sideMargin, i) + 'px'
                  }}
                  onClick={() => this.axisHeaderClick.emit(dimensionName)}
                  onContextMenu={event => {
                    event.preventDefault();
                    this.axisHeaderContextMenu.emit(dimensionName);
                  }}
                >{dimensionName}</text>
              ))}
            </div>
            <svg id="main-svg" width={width} height={height - this.axisHeaderTextSize}>
              {
                this.renderRibbons(
                  dimensionNodeListMap,
                  width,
                  height - this.axisHeaderTextSize,
                  colorScale,
                  textureScale
                )
              }
              {
                this.renderAxes(
                  dimensionValuesMap,
                  dimensionNodeListMap,
                  width,
                  height - this.axisHeaderTextSize
                )
              }
            </svg>
          </div>
        }
        <svg
          id="texture-container"
          ref={el => this.textureContainerElement = el}
          height={0}
        ></svg>
      </Host>
    );
  }


  private renderAxes(
    dimensionValuesMap: Map<string, (string | number)[]>,
    dimensionNodeListMap: Map<string, ParallelSetsDataNode[]>,
    width: number,
    height: number
  ) {
    this.hostElement.style.setProperty("--axis-text-font-size", this.axisBoxWidth * .8 + 'px');
    return this.dimensionNameList.map((dimensionName, i) => {
      const nodeList = dimensionNodeListMap.get(dimensionName);
      const currentSegmentNodeListMap = new Map<string | number, ParallelSetsDataNode[]>();
      for (const node of nodeList) {
        const currentSegmentNodeList = currentSegmentNodeListMap.get(node.valueHistory[i]);
        if (currentSegmentNodeList) {
          currentSegmentNodeList.push(node);
        }
        else {
          currentSegmentNodeListMap.set(node.valueHistory[i], [node]);
        }
      }
      const segmentElementList = [...currentSegmentNodeListMap].map(([currentSegmentValue, currentSegmentNodeList]) => {
        const x = this.obtainDimensionPosition(width, this.sideMargin, i);
        const currentSegmentPosition: [number, number] = [
          currentSegmentNodeList[0].adjustedSegmentPosition[0] || currentSegmentNodeList[0].segmentPosition[0],
          currentSegmentNodeList[currentSegmentNodeList.length - 1].adjustedSegmentPosition[1] || currentSegmentNodeList[currentSegmentNodeList.length - 1].segmentPosition[1]
        ];
        const line = <line
          x1={x}
          y1={currentSegmentPosition[0] * height}
          x2={x}
          y2={currentSegmentPosition[1] * height}
          stroke="black"
          stroke-width={this.axisStrokeWidth}
        ></line>;
        const box = <rect
          x={x}
          y={currentSegmentPosition[0] * height}
          width={this.axisBoxWidth}
          height={(currentSegmentPosition[1] - currentSegmentPosition[0]) * height}
          fill={this.axisBoxFill}
          opacity={0}
          onClick={() => this.axisSegmentClick.emit(currentSegmentNodeList)}
          onContextMenu={event => {
            event.preventDefault();
            this.contextMenu = <div
              id="context-menu-container"
              style={{
                left: (event.x < (window.innerWidth / 2) ? event.x + 'px' : undefined),
                top: (event.y < (window.innerHeight / 2) ? event.y + 'px' : undefined),
                right: (event.x > (window.innerWidth / 2) ? (window.innerWidth - event.x) + 'px' : undefined),
                bottom: (event.y > (window.innerHeight / 2) ? (window.innerHeight - event.y) + 'px' : undefined)
              }}
            >
              <ul>
                {['Move Up', 'Move Down'].map(item => (
                  <li
                    onClick={() => {
                      const swapItems = function (list: any[], index1: number, index2: number) {
                        if (index1 >= 0 && index1 < list.length && index2 >= 0 && index2 < list.length) {
                          list[index1] = list.splice(index2, 1, list[index1])[0];
                        }
                      };
                      const valueList = dimensionValuesMap.get(dimensionName);
                      const currentValueIndex = valueList.findIndex(value => value === currentSegmentValue);
                      switch (item) {
                        case 'Move Up':
                          swapItems(valueList, currentValueIndex, currentValueIndex - 1);
                          break;
                        case 'Move Down':
                          swapItems(valueList, currentValueIndex, currentValueIndex + 1);
                          break;
                      }
                      this.dimensionValuesMap = new Map(dimensionValuesMap);
                    }}
                  >
                    <text>{item}</text>
                    <hr />
                  </li>
                ))}
              </ul>
            </div>;
          }}
        >
          <title>{
            'Dimension: ' + dimensionName + '\n' +
            'Value: ' + currentSegmentValue.toString() + '\n' +
            'Count: ' + d3.sum(currentSegmentNodeList.map(d => d.dataRecordList.length)) + '\n' +
            'Proportion: ' + (d3.sum(currentSegmentNodeList.map(d => d.segmentPosition[1] - d.segmentPosition[0])) / (1 - this.maxSegmentMarginRatioAllowed) * 100).toFixed(2) + '%'
          }</title>
        </rect>;
        const text = (currentSegmentPosition[1] - currentSegmentPosition[0] >= this.minimumRatioToShowAxisText) ?
          <text
            x={x + this.axisBoxWidth / 2}
            y={currentSegmentPosition[0] * height}
            text-anchor="start"
            writing-mode="tb"
            color={this.axisSegmentTextColor}
          >{currentSegmentValue}</text> :
          undefined;
        return { line, box, text };
      });
      return <g class="axis">
        <g class="axis-line">{segmentElementList.map(element => element.line)}</g>
        <g class="axis-box">{segmentElementList.map(element => element.box)}</g>
        <g class="axis-text">{segmentElementList.map(element => element.text)}</g>
      </g>;
    });
  }

  private renderRibbons(
    dimensionNodeListMap: Map<string, ParallelSetsDataNode[]>,
    width: number,
    height: number,
    colorScale: d3.ScaleOrdinal<string, string>,
    textureScale: d3.ScaleOrdinal<string, any>
  ) {
    this.hostElement.style.setProperty('--ribbon-highlight-opacity', this.ribbonHighlightOpacity.toString());
    return this.dimensionNameList.map((dimensionName, i) => {
      const nodeList = dimensionNodeListMap.get(dimensionName);
      const nextDimensionName = this.dimensionNameList[i + 1];
      const ribbonList = nodeList.map(node => {
        const x = this.obtainDimensionPosition(width, this.sideMargin, i);
        const childX = this.obtainDimensionPosition(width, this.sideMargin, i + 1);
        const childNodeList = (dimensionNodeListMap.get(nextDimensionName) || [])
          // TODO try to use index calculation for the filter
          .filter(d => d.valueHistory.slice(0, node.valueHistory.length).toString() === node.valueHistory.toString());
        let totalPreviousCountRatio = 0;
        return childNodeList.map(childNode => {
          const childCountRatio = (childNode.segmentPosition[1] - childNode.segmentPosition[0]) *
            (node.valueHistory[i] === this.mergedSegmentName ? (1 - node.mergedSegmentAdjustmentRatio) : 1) /
            node.adjustmentRatio;
          const y1 = (node.adjustedSegmentPosition[0] + totalPreviousCountRatio) * height;
          const y2 = (node.adjustedSegmentPosition[0] + (totalPreviousCountRatio += childCountRatio)) * height;
          const childY1 = (childNode.adjustedSegmentPosition[0] || childNode.segmentPosition[0]) * height;
          const childY2 = (childNode.adjustedSegmentPosition[1] || childNode.segmentPosition[1]) * height;
          const pathD = this.obtainRibbonPathD(x, y1, y2, childX, childY1, childY2);
          const backgroundColor = colorScale(node.valueHistory[0].toString());
          let texture;
          if (this.useTextures && node.valueHistory[1] !== undefined) {
            this.textureMap.set(
              node.valueHistory[1] + '\t' + backgroundColor,
              this.createTexture(textureScale(node.valueHistory[1].toString())).background(backgroundColor)
            );
            texture = this.textureMap.get(node.valueHistory[1] + '\t' + backgroundColor);
            d3.select(this.textureContainerElement).call(texture);
          }
          const path = <path
            ref={el => d3.select(el).datum(childNode)}
            d={pathD}
            fill={texture ? texture.url() : backgroundColor}
            opacity={this.ribbonOpacity}
            onMouseEnter={() => {
              d3.select(this.hostElement.shadowRoot)
                .selectAll('g.ribbons path')
                .classed('ribbon-highlight', (d: ParallelSetsDataNode) => {
                  const minValueHistoryLenght = d3.min([d.valueHistory.length, childNode.valueHistory.length]);
                  if (d.valueHistory.slice(0, minValueHistoryLenght).toString() === childNode.valueHistory.slice(0, minValueHistoryLenght).toString()) {
                    return true;
                  } else {
                    return false;
                  }
                })
            }}
            onMouseLeave={() => {
              d3.select(this.hostElement.shadowRoot)
                .selectAll('.ribbons path')
                .classed('ribbon-highlight', false)
            }}
            onClick={() => this.ribbonClick.emit(childNode)}
          >
            <title>{
              'Dimension: ' + dimensionName + ' -> ' + nextDimensionName + '\n' +
              'Value History: ' + childNode.valueHistory.join(' -> ') + '\n' +
              'Count: ' + childNode.dataRecordList.length + '\n' +
              'Proportion: ' + (childNode.dataRecordList.length / this.data.length * 100).toFixed(2) + '%'
            }</title>
          </path>;
          return path;
        });
      });
      return <g class="ribbons">{ribbonList.flat()}</g>;
    });
  }

  private obtainRibbonPathD(x: number, y1: number, y2: number, childX: number, childY1: number, childY2: number) {
    const controlPointX1 = this.ribbonTension * x + (1 - this.ribbonTension) * childX;
    const controlPointX2 = this.ribbonTension * childX + (1 - this.ribbonTension) * x;
    const pathGenerator = d3.path();
    pathGenerator.moveTo(x, y1);
    pathGenerator.lineTo(x, y2);
    pathGenerator.bezierCurveTo(controlPointX1, y2, controlPointX2, childY2, childX, childY2);
    pathGenerator.lineTo(childX, childY1);
    pathGenerator.bezierCurveTo(controlPointX2, childY1, controlPointX1, y1, x, y1);
    pathGenerator.closePath();
    const pathD = pathGenerator.toString();
    return pathD;
  }

  private fillSegmentPositions(
    dimensionNodeListMap: Map<string, ParallelSetsDataNode[]>,
    dimensionValuesMap: Map<string, (string | number)[]>
  ) {
    for (let i = 0; i < this.dimensionNameList.length; i++) {
      const dimensionName = this.dimensionNameList[i];
      const nodeList = dimensionNodeListMap.get(dimensionName);
      let { mergedSegmentAdjustmentOffset, mergedSegmentAdjustmentOffsetRatio } =
        this.obtainMergedSegmentAdjustmentOffsetAndItsRatio(
          dimensionValuesMap,
          dimensionName,
          nodeList,
          i
        );
      this.fillSegmentPositionsForSingleDimension(
        mergedSegmentAdjustmentOffset,
        mergedSegmentAdjustmentOffsetRatio,
        i,
        dimensionName,
        nodeList,
        dimensionValuesMap
      );
    }
  }

  private fillSegmentPositionsForSingleDimension(
    mergedSegmentAdjustmentOffset: number,
    mergedSegmentAdjustmentOffsetRatio: number,
    dimensionIndex: number,
    dimensionName: string,
    nodeList: ParallelSetsDataNode[],
    dimensionValuesMap: Map<string, (string | number)[]>
  ) {
    const adjustedTotalRecordCount = this.data.length - mergedSegmentAdjustmentOffset;
    let totalMarginRatio = 0;
    for (let j = 0; j < nodeList.length; j++) {
      const node = nodeList[j];
      node.mergedSegmentAdjustmentRatio = mergedSegmentAdjustmentOffsetRatio;
      node.adjustmentRatio = adjustedTotalRecordCount / this.data.length;

      const obtainDataRecordCountAdjustmentRatio = (dataNode: ParallelSetsDataNode) => (dataNode.valueHistory[dimensionIndex] === this.mergedSegmentName) ? (1 - mergedSegmentAdjustmentOffsetRatio) : 1;
      const totalPreviousCount = d3.sum(nodeList.slice(0, j).map(d => d.dataRecordList.length));
      const totalPreviousCountRatio = totalPreviousCount / this.data.length * (1 - this.maxSegmentMarginRatioAllowed);
      const totalCurrentCountRatio = (totalPreviousCount + node.dataRecordList.length) / this.data.length * (1 - this.maxSegmentMarginRatioAllowed);
      const adjustedTotalPreviousCount = d3.sum(nodeList.slice(0, j).map(d => d.dataRecordList.length * obtainDataRecordCountAdjustmentRatio(d)));
      const adjustedTotalPreviousCountRatio = adjustedTotalPreviousCount / adjustedTotalRecordCount * (1 - this.maxSegmentMarginRatioAllowed);
      const adjustedTotalCurrentCountRatio = (adjustedTotalPreviousCount + node.dataRecordList.length * obtainDataRecordCountAdjustmentRatio(node)) / adjustedTotalRecordCount * (1 - this.maxSegmentMarginRatioAllowed);

      const segmentMarginRatio = this.maxSegmentMarginRatioAllowed / dimensionValuesMap.get(dimensionName).length / 2;
      if (nodeList[j].valueHistory[dimensionIndex] !== nodeList[j - 1]?.valueHistory[dimensionIndex]) {
        totalMarginRatio += segmentMarginRatio;
      }

      if (mergedSegmentAdjustmentOffset) {
        node.adjustedSegmentPosition = [
          adjustedTotalPreviousCountRatio + totalMarginRatio,
          adjustedTotalCurrentCountRatio + totalMarginRatio
        ];
      }
      node.segmentPosition = [
        totalPreviousCountRatio + totalMarginRatio,
        totalCurrentCountRatio + totalMarginRatio
      ];

      if (nodeList[j].valueHistory[dimensionIndex] !== nodeList[j + 1]?.valueHistory[dimensionIndex]) {
        totalMarginRatio += segmentMarginRatio;
      }
    }
  }

  private obtainMergedSegmentAdjustmentOffsetAndItsRatio(
    dimensionValuesMap: Map<string, (string | number)[]>,
    dimensionName: string,
    nodeList: ParallelSetsDataNode[],
    dimensionIndex: number
  ) {
    let mergedSegmentAdjustmentOffset = 0;
    let mergedSegmentAdjustmentOffsetRatio = 0;
    if (dimensionValuesMap.get(dimensionName).find(value => value === this.mergedSegmentName)) {
      let mergedSegmentRecordCount = d3.sum(
        nodeList.filter(node =>
          node.valueHistory[dimensionIndex] === this.mergedSegmentName
        )
          .map(node => node.dataRecordList.length)
      );
      if (mergedSegmentRecordCount / this.data.length > this.mergedSegmentMaxRatio) {
        mergedSegmentAdjustmentOffset = (mergedSegmentRecordCount - (this.data.length * this.mergedSegmentMaxRatio)) / (1 - this.mergedSegmentMaxRatio);
        mergedSegmentAdjustmentOffsetRatio = mergedSegmentAdjustmentOffset / mergedSegmentRecordCount;
      }
    }
    return { mergedSegmentAdjustmentOffset, mergedSegmentAdjustmentOffsetRatio };
  }

  private removeEmptyDataRecordsForDimensionNodeListMap(dimensionNodeListMap: Map<string, ParallelSetsDataNode[]>) {
    for (const [dimensionName, nodeList] of dimensionNodeListMap) {
      dimensionNodeListMap.set(dimensionName, nodeList.filter(node => node.dataRecordList.length > 0));
    }
  }

  private fillDataRecordListForDimensionNodeListMap(
    dimensionValuesMap: Map<string, (string | number)[]>,
    dimensionNodeListMap: Map<string, ParallelSetsDataNode[]>
  ) {
    const nodeList = [...dimensionNodeListMap.values()].flatMap(d => d);
    for (const dataRecord of this.data) {
      for (const node of nodeList) {
        let areAllPropertyMatching = true;
        for (let i = 0; i < node.valueHistory.length; i++) {
          const currentDimensionName = this.dimensionNameList[i];
          const currentValue = dataRecord[currentDimensionName];
          if (
            (node.valueHistory[i] !== this.mergedSegmentName && node.valueHistory[i] !== currentValue) ||
            (node.valueHistory[i] === this.mergedSegmentName && dimensionValuesMap.get(currentDimensionName).find(d => d === currentValue) !== undefined)
          ) {
            areAllPropertyMatching = false;
            continue;
          }
        }
        if (areAllPropertyMatching) {
          node.dataRecordList.push(dataRecord);
        }
      }
    }
  }

  private generateDimensionNodeListMap(dimensionValuesMap: Map<string, (string | number)[]>) {
    const dimensionNodeListMap = new Map<string, ParallelSetsDataNode[]>();
    for (let i = 0; i < this.dimensionNameList.length; i++) {
      const currentDimensionName = this.dimensionNameList[i];
      const previousDimensionName = (i > 0) ? this.dimensionNameList[i - 1] : '';
      const currentDimensionNodeList: ParallelSetsDataNode[] = [];
      const currentDimensionValueList = dimensionValuesMap.get(currentDimensionName);
      const previousDimensionValueList = dimensionValuesMap.get(previousDimensionName);
      const previousDimensionNodeList = dimensionNodeListMap.get(previousDimensionName);

      let columnIndex = 0;
      const previousDimensionValueCount = i > 0 ? previousDimensionValueList.length : 1;
      const previousDimensionGroupCount = i > 0 ? previousDimensionNodeList.length / previousDimensionValueList.length : 1;
      for (let currentDimensionValueIndex = 0; currentDimensionValueIndex < currentDimensionValueList.length; currentDimensionValueIndex++) {
        for (let previousDimensionGroupIndex = 0; previousDimensionGroupIndex < previousDimensionGroupCount; previousDimensionGroupIndex++) {
          for (let previousDimensionValueIndex = 0; previousDimensionValueIndex < previousDimensionValueCount; previousDimensionValueIndex++) {
            currentDimensionNodeList[columnIndex] = Object.assign(new ParallelSetsDataNode, {
              valueHistory: i > 0 ?
                [
                  ...previousDimensionNodeList[previousDimensionGroupIndex + previousDimensionValueIndex * previousDimensionGroupCount].valueHistory,
                  currentDimensionValueList[currentDimensionValueIndex]
                ] :
                [currentDimensionValueList[currentDimensionValueIndex]]
            });
            columnIndex++;
          }
        }
      }
      dimensionNodeListMap.set(currentDimensionName, currentDimensionNodeList);
    }
    return dimensionNodeListMap;
  }

  private generateDimensionValuesMap() {
    const dimensionValuesMapEntryList = this.dimensionNameList.map(dimensionName => {
      const currentDimensionValueList = [...new Set(this.data.map(dataRecord => dataRecord[dimensionName]))]
        .sort((a, b) => {
          switch (typeof a) {
            case 'number':
              return a - (b as number);
            case 'string':
              return compareStrings(a, b as string);
          }
        });
      return [dimensionName, currentDimensionValueList] as [string, (string | number)[]];
    });
    for (let i = 0; i < dimensionValuesMapEntryList.length; i++) {
      const dimensionValuesMapEntry = dimensionValuesMapEntryList[i];
      const maxSegmentLimit = this.maxSegmentLimit?.[i] || this.maxSegmentLimit;
      if (dimensionValuesMapEntry[1].length > maxSegmentLimit) {
        dimensionValuesMapEntry[1].splice(maxSegmentLimit);
        dimensionValuesMapEntry[1].push(this.mergedSegmentName);
      }
    }
    const dimensionValuesMap = new Map(dimensionValuesMapEntryList);
    return dimensionValuesMap;
  }

  private obtainDimensionPosition(width: number, margin: number, index: number) {
    return (width - margin * 2 - this.axisBoxWidth) / (this.dimensionNameList.length - 1) * index + margin;
  }

  private createTexture(textureDefinition: string) {
    return eval(textureDefinition);
  }

}
