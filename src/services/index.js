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
    setActor, getActor, actorScope,
    toTimestamp, toDate, formatDate, toNumber, money,
    listDocs, getById,
} from './core';

// ── constants and enumerations ────────────────────────────────────────────
export {
    COL,
    PRODUCT_CATEGORY, PRODUCT_TYPE, UNIT, WHO_CLASS, STATUS,
    LICENCE_SCOPE, LICENCE_TYPE, LICENCE_FOR_CATEGORY,
    LICENCE_TYPE_FOR_SCOPE, LICENCE_WRITE_ROLES,
    SALE_STATUS, SALE_FLOW, PAYMENT_TYPE, SALE_SOURCE,
    OFFICE, OFFICE_LABEL, officeLabel, officeOptions, MOVEMENT_TYPE,
    OFFER_STATUS, OFFER_TYPE, OFFER_BUY_TYPE, OFFER_MODULE,
    DEMAND_STATUS,
    PARTY, ENTRY_TYPE, OPENING_STATUS, BALANCE_SIGN,
    PAY_METHOD, PAYMENT_STATUS, EXPENSE_TYPE,
    PURCHASE_STATUS, RETURN_STATUS, REPACK_STATUS,
    COMMISSION_BASIS, COMMISSION_METHOD, COMMISSION_STATUS,
    ROLE, OVERRIDE_ROLES, SALE_UPDATE_ROLES, AUDIT_ACTION, RULE_CODE,
} from './constants';

// ── products ──────────────────────────────────────────────────────────────
export {
    getProduct, getProductOrThrow, listProducts, productOptions,
    createProduct, updateProduct, deactivateProduct,
    banProduct, unbanProduct, isBannedOn, listBannedProducts,
    setSafetyData, hasSafetyData, safetySnapshot, SIGNAL_WORD_BN,
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
    listExpiring, expirySummary, complianceReport, overriddenLicenceValue,
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
    getUser, getUserOrThrow, getMyProfile, listUsers, listOfficers,
    createUserProfile, updateUser, updateMyProfile, updateUserPermissions, deactivateUser,
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

export {
    getSupplier, getSupplierOrThrow, listSuppliers, supplierOptions,
    listSuppliersWithPayable, nextSupplierCode,
    createSupplier, updateSupplier, deactivateSupplier, adjustSupplierBalance,
} from './suppliers';

export {
    getOpeningBalance, listOpeningBalances, signedDelta,
    createOpeningBalance, cancelOpeningBalance, updateOpeningBalanceNote,
} from './openingBalances';

export {
    getSupplierPayment, getSupplierPaymentOrThrow, listSupplierPayments,
    createSupplierPayment, updateSupplierPayment,
    approveSupplierPayment, cancelSupplierPayment,
} from './supplierPayments';

export {
    getCommission, getCommissionOrThrow, listCommissions, nextCommissionCode,
    commissionFromPercent, createCommission, approveCommission, cancelCommission,
} from './commissions';

export {
    getExpense, getExpenseOrThrow, listExpenses, expenseByHead,
    nextExpenseCode, nextVoucherNo,
    createExpense, updateExpense, approveExpense, cancelExpense,
} from './expenses';

export {
    getPurchase, getPurchaseOrThrow, getPurchaseItems, getPurchaseWithItems,
    listPurchases, nextPurchaseNo, bannedPurchaseChecks,
    createPurchase, cancelPurchase, updatePurchaseNote,
} from './purchases';

export {
    getPurchaseReturn, getPurchaseReturnOrThrow, listPurchaseReturns, nextReturnNo,
    createPurchaseReturn, approvePurchaseReturn, cancelPurchaseReturn,
} from './purchaseReturns';

export {
    getBom, getBomOrThrow, listBoms, bomOptions, nextBomNo, explodeBom,
    createBom, updateBom, deactivateBom,
} from './boms';

export {
    getRepacking, getRepackingOrThrow, listRepackings, nextRepackNo,
    checkMaterials, createRepacking, cancelRepacking,
} from './repackings';
