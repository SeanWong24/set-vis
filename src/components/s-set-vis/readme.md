# s-set-vis



<!-- Auto Generated Below -->


## Properties

| Property                    | Attribute                      | Description | Type       | Default     |
| --------------------------- | ------------------------------ | ----------- | ---------- | ----------- |
| `data`                      | --                             |             | `any[]`    | `[]`        |
| `parallelSetsDimensions`    | --                             |             | `string[]` | `undefined` |
| `parallelSetsRibbonTension` | `parallel-sets-ribbon-tension` |             | `number`   | `1`         |
| `statisticsPlotGroups`      | --                             |             | `string[]` | `undefined` |


## Dependencies

### Depends on

- s-parallel-sets
- [s-statistics-plot-group](../s-statistics-plot-group)

### Graph
```mermaid
graph TD;
  s-set-vis --> s-parallel-sets
  s-set-vis --> s-statistics-plot-group
  style s-set-vis fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
