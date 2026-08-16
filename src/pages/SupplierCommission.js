import React from 'react';
import Commission from './Commission';

// The supplier mode of Commission.js. The customer mode is
// CustomerCommission.js — same component, same collection, different party.
// See the header of Commission.js for what changed and why.

const SupplierCommission = () => <Commission party="supplier" />;

export default SupplierCommission;
