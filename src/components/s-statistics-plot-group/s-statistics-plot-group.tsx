import { Component, ComponentInterface, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 's-statistics-plot-group',
  styleUrl: 's-statistics-plot-group.css',
  shadow: true,
})
export class SStatisticsPlotGroup implements ComponentInterface {

  @Prop() header: string;

  render() {
    return (
      <Host>
        <text id="header">{this.header}</text>
      </Host>
    );
  }

}
