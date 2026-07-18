import {
  isQuickActionAvailable,
} from './taskStatusConfig';

const makeContext = (overrides = {}) => {
  return {
    permissions: {
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: false,
      canAssign: true,
      canApprove: false,
      canComplete: true,
      reportScope: 'department',
      ...(overrides.permissions || {}),
    },
    userDepartment: overrides.userDepartment || 'program',
    taskDepartment: overrides.taskDepartment || 'program',
  };
};

describe('isQuickActionAvailable - department specific rules', () => {
  it('allows all quick actions for program department when permissions allow', () => {
    const ctx = makeContext({
      userDepartment: 'program',
      taskDepartment: 'program',
    });

    expect(isQuickActionAvailable('REASSIGN', ctx)).toBe(true);
    expect(isQuickActionAvailable('CHANGE_DUE_DATE', ctx)).toBe(true);
    expect(isQuickActionAvailable('CHANGE_PRIORITY', ctx)).toBe(true);
    expect(isQuickActionAvailable('ESCALATE', ctx)).toBe(true);
    expect(isQuickActionAvailable('MOVE_PROJECT', ctx)).toBe(true);
    expect(isQuickActionAvailable('ADD_TAGS', ctx)).toBe(true);
    expect(isQuickActionAvailable('GENERATE_REPORT', ctx)).toBe(true);
  });

  it('restricts quick actions for accounts_and_finance according to config', () => {
    const ctx = makeContext({
      userDepartment: 'accounts_and_finance',
      taskDepartment: 'accounts_and_finance',
    });

    expect(isQuickActionAvailable('CHANGE_DUE_DATE', ctx)).toBe(true);
    expect(isQuickActionAvailable('CHANGE_PRIORITY', ctx)).toBe(true);
    expect(isQuickActionAvailable('GENERATE_REPORT', ctx)).toBe(true);

    expect(isQuickActionAvailable('REASSIGN', ctx)).toBe(false);
    expect(isQuickActionAvailable('ESCALATE', ctx)).toBe(false);
    expect(isQuickActionAvailable('MOVE_PROJECT', ctx)).toBe(false);
    expect(isQuickActionAvailable('ADD_TAGS', ctx)).toBe(false);
  });

  it('returns false when base permission checks fail, regardless of department', () => {
    const ctx = makeContext({
      userDepartment: 'program',
      taskDepartment: 'program',
      permissions: {
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canAssign: false,
        canApprove: false,
        canComplete: false,
        reportScope: 'department',
      },
    });

    expect(isQuickActionAvailable('REASSIGN', ctx)).toBe(false);
    expect(isQuickActionAvailable('CHANGE_DUE_DATE', ctx)).toBe(false);
    expect(isQuickActionAvailable('CHANGE_PRIORITY', ctx)).toBe(false);
    expect(isQuickActionAvailable('ESCALATE', ctx)).toBe(false);
    expect(isQuickActionAvailable('MOVE_PROJECT', ctx)).toBe(false);
    expect(isQuickActionAvailable('ADD_TAGS', ctx)).toBe(false);
    expect(isQuickActionAvailable('GENERATE_REPORT', ctx)).toBe(true);
  });
});
