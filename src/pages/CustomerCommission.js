import React from 'react';
import Commission from './Commission';

// The customer mode of Commission.js. The supplier mode is
// SupplierCommission.js — same component, same collection, different party.
// See the header of Commission.js for what changed and why.

const CustomerCommission = () => <Commission party="customer" />;

export default CustomerCommission;
