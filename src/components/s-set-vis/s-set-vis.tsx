import { Component, Host, h, Element, Prop, State } from '@stencil/core';
import 's-vis';

@Component({
  tag: 's-set-vis',
  styleUrl: 's-set-vis.css',
  shadow: true,
})
export class SSetVis {

  @Element() hostElement: HTMLElement;

  @State() hostElementBoundingClientRect: DOMRect;

  @Prop() data: any[] = [];
  @Prop() parallelSetsRibbonTension: number = 1;

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
          ribbonTension={this.parallelSetsRibbonTension}
        ></s-parallel-sets>
      </Host>
    );
  }

}
