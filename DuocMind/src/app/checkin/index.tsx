import Checkin from '../views/checkin/checkin';

// Debug import — Metro/Expo may resolve to undefined if the module failed to export correctly
// Console output will show what Metro actually imported for diagnosis
// eslint-disable-next-line no-console
console.log('DEBUG: checkin import', typeof Checkin, Checkin);

export default Checkin;
