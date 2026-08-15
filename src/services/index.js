// One import point for every screen:
//
//   import { listProducts, createSale, ServiceError } from '../services';
//
// Import from here rather than from the individual files. If a function later
// moves between modules, only this file changes and no screen breaks.
//
// Data model: docs/FIRESTORE-SCHEMA.md · How to use it: src/services/README.md

// ── core ──────────────────────────────────────────────────────────────────
export {
    ServiceError,
    setActor, getActor,
    toTimestamp, toDate, formatDate, toNumber, money,
    listDocs, getById,
} from './core';

// ── constants and enumerations ────────────────────────────────────────────
export {
    COL,
    PRODUCT_CATEGORY, PRODUCT_TYPE, UNIT, WHO_CLASS, STATUS,
    LICENCE_SCOPE, LICENCE_TYPE, LICENCE_FOR_CATEGORY,
    SALE_STATUS, SALE_FLOW, PAYMENT_TYPE, SALE_SOURCE,
    OFFICE, OFFICE_LABEL, officeLabel, officeOptions, MOVEMENT_TYPE,
    OFFER_STATUS, OFFER_TYPE, OFFER_BUY_TYPE, OFFER_MODULE,
    DEMAND_STATUS,
    ROLE, AUDIT_ACTION, RULE_CODE,
} from './constants';

// ── products ──────────────────────────────────────────────────────────────
export {
    getProduct, getProductOrThrow, listProducts, productOptions,
    createProduct, updateProduct, deactivateProduct,
    banProduct, unbanProduct, isBannedOn, listBannedProducts,
    setSafetyData, hasSafetyData, safetySnapshot,
} from './products';

// ── customers (dealers) ───────────────────────────────────────────────────
export {
    getCustomer, getCustomerOrThrow, listCustomers, customerOptions,
    listCustomersWithDue,
    createCustomer, updateCustomer, deactivateCustomer,
    adjustBalance, creditLimitCheck,
} from './customers';

// ── licences (Feature 1) ──────────────────────────────────────────────────
export {
    getLicence, getLicenceOrThrow, listLicences, getDealerLicences,
    listExpiring, expirySummary, complianceReport,
    createLicence, updateLicence, renewLicence,
    licenceStatus, daysToExpiry, isExpired, withStatus,
    requiredLicenceType, licenceCheckFor,
} from './licences';

// ── sales ─────────────────────────────────────────────────────────────────
export {
    getSale, getSaleOrThrow, getSaleItems, getSaleWithItems,
    listSales, listCancelledSales, listDueSales, statusCounts,
    createSale, nextInvoiceNo,
    nextStatus, updateSaleStatus, advanceSale, cancelSale, recordPayment,
    productSalesReport, salesGroupedBy,
} from './sales';

// ── stock ─────────────────────────────────────────────────────────────────
export {
    recordMovement, listMovements, getStockBalance,
    stockReport, centralStockReport, lowStock,
    buildMovement, queueMovements, signedQty,
} from './stock';

// ── users ─────────────────────────────────────────────────────────────────
export {
    getUser, getUserOrThrow, listUsers, listOfficers,
    createUserProfile, updateUser, updateUserPermissions, deactivateUser,
    startSession, endSession, hasAccess,
} from './users';

// ── audit ─────────────────────────────────────────────────────────────────
export {
    writeAudit, logRuleOverride, logAuth, listAudit, listOverrides,
} from './audit';

// ── Tier 2 (schema §10) ───────────────────────────────────────────────────
// Added as each screen in SCREEN-AUDIT.md §2.1 is wired to Firestore.

export {
    getExpenseHead, getExpenseHeadOrThrow, listExpenseHeads, expenseHeadOptions,
    createExpenseHead, updateExpenseHead, deactivateExpenseHead,
} from './expenseHeads';

export {
    getBankAccount, getBankAccountOrThrow, listBankAccounts, bankAccountOptions,
    createBankAccount, updateBankAccount, deactivateBankAccount,
} from './bankAccounts';

export {
    getOffer, getOfferOrThrow, listOffers, isRunningOn, nextOfferCode,
    createOffer, updateOffer, publishOffer, unpublishOffer, archiveOffer, offerQtyLabel,
} from './offers';

export {
    getDemand, getDemandOrThrow, listDemands, nextRequestNo,
    demandTotals, packNotation, createDemand, setDemandStatus,
} from './productDemands';
