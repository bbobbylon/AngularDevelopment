import { AfterContentInit, Component, contentChildren, signal } from '@angular/core';
import { TabLabel } from '../tab-label/tab-label';
import { TabPanel } from '../tab-panel/tab-panel';

/**
 * TabGroup demonstrates contentChildren(): it queries projected TabLabel
 * and TabPanel directives to drive its tab bar without any template binding.
 */
@Component({
  selector: 'app-tab-group',
  standalone: true,
  // No template imports: TabLabel/TabPanel match in the PROJECTING component's
  // template — TabGroup only queries them via contentChildren().
  templateUrl: './tab-group.html',
  styleUrl: './tab-group.css',
})
export class TabGroup implements AfterContentInit {
  /**
   * Which tab is selected.
   */
  protected readonly active = signal(0);

  // contentChildren() — signal-based query over projected directives.
  // Runs after content initialises and updates reactively if children change.
  /**
   * The projected labels, as a signal-based content query.
   */
  readonly labels  = contentChildren(TabLabel);
  /**
   * The projected panels, in the same order as the labels.
   */
  readonly panels  = contentChildren(TabPanel);

  /**
   * Sets the initial visibility once projected content exists.
   *
   * `ngAfterContentInit` is the first point at which content queries have
   * resolved — reading them in the constructor gets an empty list. An `effect`
   * over the query signals would work equally well.
   */
  ngAfterContentInit(): void {
    // Sync visible panel whenever active index changes — effect() would also work.
    this.syncPanels();
  }

  /**
   * Shows the active panel and hides the rest.
   *
   * Works on the projected elements directly, because the panels are the caller's
   * DOM: this component never renders them, it only decides which one is visible.
   * That is the whole trick behind a projection-based tab group.
   */
  protected syncPanels(): void {
    const idx = this.active();
    this.panels().forEach((p, i) => {
      if (i === idx) p.el.nativeElement.classList.add('visible');
      else           p.el.nativeElement.classList.remove('visible');
    });
  }

  /**
   * Selects a tab.
   *
   * @param idx Which tab.
   */
  protected onTabClick(idx: number): void {
    this.active.set(idx);
    this.syncPanels();
  }
}
