import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

const STATE_OPTIONS = [
  {
    name: 'No_data',
    value: {
      days: 0,
    },
  },
  {
    name: '7_days',
    value: {
      days: 7,
    },
  },
  {
    name: '30_days',
    value: {
      days: 30,
    },
  },
  {
    name: '90_days',
    value: {
      days: 90,
    },
  },
  {
    name: 'One_year',
    value: {
      days: 365,
    },
  },
  {
    name: 'Two_years',
    value: {
      days: 730,
    },
  },
];

export default class ControlPanel extends Component {
  @service dashboardStats;
  @service dashboardMocks;
  @service intl;

  stateOptions = STATE_OPTIONS.map((stateOption) => ({
    ...stateOption,
    name: this.intl.t(`Manual.Dashboard.${stateOption.name}`),
  }));

  @tracked state = STATE_OPTIONS[1].value;

  @action
  onInsert() {
    this.loadState();
    this.dashboardMocks.updateMockedData(this.state);
    // Don't reload all (because then we would load unused graphs too)

    if (this.enabled) {
      this.updateState();
    }
  }

  saveState() {
    try {
      localStorage.setItem('dashboard5-prototype-state', JSON.stringify(this.state));
      localStorage.setItem(
        'dashboard5-prototype-status',
        JSON.stringify(this.dashboardMocks.siteStatus),
      );
      localStorage.setItem('dashboard5-prototype-enabled', JSON.stringify(this.enabled));
    } catch (e) {
      // ignore localStorage not supported errors
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem('dashboard5-prototype-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed) {
          this.state = parsed;
        }
      }

      const savedStatus = localStorage.getItem('dashboard5-prototype-status');
      if (savedStatus) {
        const parsed = JSON.parse(savedStatus);
        if (parsed) {
          this.dashboardMocks.siteStatus = { ...this.dashboardMocks.siteStatus, ...parsed };
        }
      }

      const enabledStr = localStorage.getItem('dashboard5-prototype-enabled');
      if (enabledStr) {
        const parsed = JSON.parse(enabledStr);
        if (typeof parsed === 'boolean' && parsed !== this.dashboardMocks.enabled) {
          this.dashboardMocks.enabled = parsed;
        }
      }
    } catch (e) {
      // ignore localStorage not supported errors
    }
  }

  get selectedStateOption() {
    return this.stateOptions.find((option) => option.value.days === this.state.days);
  }

  @action
  onStateChange(option) {
    this.state = option.value;
    this.updateMockedData();
    this.updateState();
  }

  @action
  updateMockedData() {
    this.dashboardMocks.updateMockedData(this.state);
  }

  updateState() {
    this.dashboardStats.reloadAll();
    this.saveState();
  }

  // Convenience mappers
  get enabled() {
    return this.dashboardMocks.enabled;
  }

  set enabled(val) {
    this.dashboardMocks.enabled = val;
    this.updateState();
  }

  get mockPaidTiers() {
    return this.dashboardMocks.siteStatus?.hasPaidTiers;
  }

  set mockPaidTiers(val) {
    this.dashboardMocks.siteStatus.hasPaidTiers = val;
    this.updateState();
  }

  get mockMultipleTiers() {
    return this.dashboardMocks.siteStatus?.hasMultipleTiers;
  }

  set mockMultipleTiers(val) {
    this.dashboardMocks.siteStatus.hasMultipleTiers = val;
    this.updateState();
  }

  get mockNewslettersEnabled() {
    return this.dashboardMocks.siteStatus?.newslettersEnabled;
  }

  set mockNewslettersEnabled(val) {
    this.dashboardMocks.siteStatus.newslettersEnabled = val;
    this.updateState();
  }

  get mockMembersEnabled() {
    return this.dashboardMocks.siteStatus?.membersEnabled;
  }

  set mockMembersEnabled(val) {
    this.dashboardMocks.siteStatus.membersEnabled = val;
    this.updateState();
  }
}
