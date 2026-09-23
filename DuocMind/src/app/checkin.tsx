
//import CheckinScreen from './views/checkin/checkin';
import React from 'react';

// Explicit wrapper to ensure the imported component is a valid React component
export default function WrappedCheckin() {
  // runtime sanity check (Metro console)
  if (typeof CheckinScreen !== 'function' && typeof CheckinScreen !== 'object') {
    console.error('CheckinScreen is not a valid component:', CheckinScreen);
    return null;
  }
  return React.createElement(CheckinScreen, null);
}