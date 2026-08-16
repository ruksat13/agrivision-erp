import React from 'react';
import OpeningBalance from './OpeningBalance';

// The customer mode of OpeningBalance.js. The supplier mode is
// SupplierOpeningBalance.js — same component, same collection, different party.
//
// SCREEN-AUDIT.md §2.1.1 noted that adjusting `customers.balance` is a Tier 1
// write, but that the screen lists individual entries with their own dates and
// notes, so the entries need a collection of their own. They have one; the
// balance adjustment rides along in the same batch.

const CustomerOpeningBalance = () => <OpeningBalance party="customer" />;

export default CustomerOpeningBalance;
