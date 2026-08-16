import React from 'react';
import OpeningBalance from './OpeningBalance';

// The supplier mode of OpeningBalance.js. The customer mode is
// CustomerOpeningBalance.js — same component, same collection, different party.
// See the header of OpeningBalance.js for why they were merged.

const SupplierOpeningBalance = () => <OpeningBalance party="supplier" />;

export default SupplierOpeningBalance;
