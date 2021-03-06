# s-set-vis



<!-- Auto Generated Below -->


## Properties

| Property                          | Attribute                           | Description | Type                                            | Default                |
| --------------------------------- | ----------------------------------- | ----------- | ----------------------------------------------- | ---------------------- |
| `data`                            | --                                  |             | `any[]`                                         | `[]`                   |
| `parallelSetsColorScheme`         | --                                  |             | `string[]`                                      | `[...d3.schemeAccent]` |
| `parallelSetsDimensions`          | --                                  |             | `string[]`                                      | `undefined`            |
| `parallelSetsMaxSegmentLimit`     | `parallel-sets-max-segment-limit`   |             | `number \| number[]`                            | `10`                   |
| `parallelSetsMergedSegmentName`   | `parallel-sets-merged-segment-name` |             | `string`                                        | `'*Other*'`            |
| `parallelSetsRibbonTension`       | `parallel-sets-ribbon-tension`      |             | `number`                                        | `1`                    |
| `parallelSetsTexutureDefinitions` | --                                  |             | `string[]`                                      | `undefined`            |
| `statisticsPlotGroupDefinitions`  | --                                  |             | `{ dimensionName: string; visType: string; }[]` | `undefined`            |


## Dependencies

### Depends on

- [s-parallel-sets](../s-parallel-sets)
- [s-statistics-plot-group](../s-statistics-plot-group)

### Graph
```mermaid
graph TD;
  s-set-vis --> s-parallel-sets
  s-set-vis --> s-statistics-plot-group
  s-statistics-plot-group --> s-bar
  s-statistics-plot-group --> s-box
  style s-set-vis fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
