"use strict";
/**
 * Email Collector - FINAL TEST MISSION
 * Collects email accounts using all integrated systems:
 * - DOM Manipulation for form filling
 * - CAPTCHA Solver for bypassing challenges
 * - Password Vault for secure credential storage
 * - AgentDB for learning patterns
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailCollector = exports.EMAIL_SIGNUP_FLOWS = void 0;
var dom_manipulator_1 = require("./dom-manipulator");
var captcha_solver_1 = require("../lib/captcha-solver");
/**
 * Pre-configured email signup flows
 */
exports.EMAIL_SIGNUP_FLOWS = {
    guerrillamail: {
        provider: 'GuerrillaMail',
        signupUrl: 'https://www.guerrillamail.com/',
        steps: [
            { type: 'navigate', url: 'https://www.guerrillamail.com/' },
            { type: 'wait', waitFor: '#email-widget', timeout: 5000 },
            { type: 'extract', selector: '#email-widget', extractKey: 'email' },
        ],
    },
    tempmail: {
        provider: 'TempMail',
        signupUrl: 'https://temp-mail.org/',
        steps: [
            { type: 'navigate', url: 'https://temp-mail.org/' },
            { type: 'wait', waitFor: '#mail', timeout: 5000 },
            { type: 'extract', selector: '#mail', extractKey: 'email' },
        ],
    },
    tenminutemail: {
        provider: '10MinuteMail',
        signupUrl: 'https://10minutemail.com/',
        steps: [
            { type: 'navigate', url: 'https://10minutemail.com/' },
            { type: 'wait', waitFor: '#mailAddress', timeout: 5000 },
            { type: 'extract', selector: '#mailAddress', extractKey: 'email' },
        ],
    },
    maildrop: {
        provider: 'MailDrop',
        signupUrl: 'https://maildrop.cc/',
        steps: [
            { type: 'navigate', url: 'https://maildrop.cc/' },
            { type: 'wait', waitFor: '.inbox-address', timeout: 5000 },
            { type: 'extract', selector: '.inbox-address', extractKey: 'email' },
        ],
    },
    mohmal: {
        provider: 'Mohmal',
        signupUrl: 'https://www.mohmal.com/en',
        steps: [
            { type: 'navigate', url: 'https://www.mohmal.com/en' },
            { type: 'click', selector: 'button[onclick="randomMail()"]' },
            { type: 'wait', waitFor: '#mailAddress', timeout: 3000 },
            { type: 'extract', selector: '#mailAddress', extractKey: 'email' },
        ],
    },
};
/**
 * EmailCollector - Automated email account collection
 */
var EmailCollector = /** @class */ (function () {
    function EmailCollector(document, passwordVault, agentDB, captchaSolverMasterKey) {
        this.dom = new dom_manipulator_1.DOMManipulator(document);
        this.captchaSolver = new captcha_solver_1.CAPTCHASolver(document);
        this.passwordVault = passwordVault;
        this.agentDB = agentDB;
        this.accounts = [];
    }
    /**
     * Execute an email signup flow
     */
    EmailCollector.prototype.executeFlow = function (flow) {
        return __awaiter(this, void 0, void 0, function () {
            var account, _i, _a, step, pattern, captchaResult, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83C\uDFAF Starting signup flow for ".concat(flow.provider, "..."));
                        account = {
                            provider: flow.provider,
                            signupUrl: flow.signupUrl,
                            createdAt: new Date().toISOString(),
                            captchaSolved: false,
                            success: false,
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 9]);
                        _i = 0, _a = flow.steps;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        step = _a[_i];
                        return [4 /*yield*/, this.executeStep(step, account)];
                    case 3:
                        _b.sent();
                        pattern = {
                            action: step.type,
                            selector: step.selector,
                            value: step.value,
                            url: flow.signupUrl,
                            success: true,
                            metadata: {
                                provider: flow.provider,
                                stepType: step.type,
                            },
                        };
                        this.agentDB.storeAction(pattern);
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!this.captchaSolver.detect()) return [3 /*break*/, 7];
                        console.log("\uD83E\uDD16 CAPTCHA detected: ".concat(this.captchaSolver.getCaptchaType()));
                        return [4 /*yield*/, this.captchaSolver.solve()];
                    case 6:
                        captchaResult = _b.sent();
                        if (captchaResult) {
                            console.log('✅ CAPTCHA solved automatically!');
                            account.captchaSolved = true;
                            // Store CAPTCHA success in AgentDB
                            this.agentDB.storeAction({
                                action: 'solve_captcha',
                                url: flow.signupUrl,
                                success: true,
                                metadata: {
                                    captchaType: this.captchaSolver.getCaptchaType(),
                                    strategy: this.captchaSolver.getStrategy(),
                                },
                            });
                        }
                        else {
                            console.log('⚠️ CAPTCHA requires human intervention');
                            account.captchaSolved = false;
                        }
                        _b.label = 7;
                    case 7:
                        // Generate password if account requires it
                        if (!account.password) {
                            account.password = this.passwordVault.generatePassword(16);
                        }
                        account.success = true;
                        console.log("\u2705 Successfully collected email: ".concat(account.email));
                        // Store in password vault
                        if (account.email && account.password) {
                            this.passwordVault.store(flow.provider, account.email, account.password, "Email account from ".concat(flow.signupUrl));
                        }
                        this.accounts.push(account);
                        return [2 /*return*/, account];
                    case 8:
                        error_1 = _b.sent();
                        console.error("\u274C Error in ".concat(flow.provider, " signup:"), error_1);
                        // Store failure in AgentDB
                        this.agentDB.storeAction({
                            action: 'signup_flow',
                            url: flow.signupUrl,
                            success: false,
                            metadata: {
                                provider: flow.provider,
                                error: String(error_1),
                            },
                        });
                        account.success = false;
                        throw error_1;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a single step in the signup flow
     */
    EmailCollector.prototype.executeStep = function (step, account) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, value, element, value;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = step.type;
                        switch (_a) {
                            case 'navigate': return [3 /*break*/, 1];
                            case 'fill': return [3 /*break*/, 2];
                            case 'click': return [3 /*break*/, 3];
                            case 'wait': return [3 /*break*/, 4];
                            case 'extract': return [3 /*break*/, 7];
                            case 'captcha': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 11];
                    case 1:
                        if (step.url) {
                            console.log("  \u2192 Navigate to: ".concat(step.url));
                            // In real browser: window.location.href = step.url
                            // For demo: simulate navigation
                        }
                        return [3 /*break*/, 11];
                    case 2:
                        if (step.selector && step.value) {
                            console.log("  \u2192 Fill field: ".concat(step.selector));
                            value = step.value;
                            // Replace placeholders
                            if (value === '{{email}}' && account.email) {
                                value = account.email;
                            }
                            else if (value === '{{password}}' && account.password) {
                                value = account.password;
                            }
                            this.dom.fillField(step.selector, value);
                        }
                        return [3 /*break*/, 11];
                    case 3:
                        if (step.selector) {
                            console.log("  \u2192 Click: ".concat(step.selector));
                            this.dom.clickElement(step.selector);
                        }
                        return [3 /*break*/, 11];
                    case 4:
                        if (!step.waitFor) return [3 /*break*/, 6];
                        console.log("  \u2192 Wait for: ".concat(step.waitFor));
                        return [4 /*yield*/, this.dom.waitForElement(step.waitFor, step.timeout || 5000)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [3 /*break*/, 11];
                    case 7:
                        if (step.selector && step.extractKey) {
                            console.log("  \u2192 Extract from: ".concat(step.selector));
                            element = this.dom.findElement(step.selector);
                            if (element) {
                                value = element.textContent || element.value || '';
                                account[step.extractKey] = value.trim();
                                console.log("    Extracted ".concat(step.extractKey, ": ").concat(value.trim()));
                            }
                        }
                        return [3 /*break*/, 11];
                    case 8:
                        console.log('  → Handling CAPTCHA...');
                        if (!this.captchaSolver.detect()) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.captchaSolver.solve()];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Collect multiple email accounts
     */
    EmailCollector.prototype.collectMultiple = function () {
        return __awaiter(this, arguments, void 0, function (count) {
            var flows, collected, i, account, error_2;
            if (count === void 0) { count = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n\uD83C\uDFAE EMAIL GAUNTLET: Collecting ".concat(count, " email accounts...\n"));
                        flows = Object.values(exports.EMAIL_SIGNUP_FLOWS);
                        collected = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < Math.min(count, flows.length))) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        console.log("\n[".concat(i + 1, "/").concat(count, "] Attempting ").concat(flows[i].provider, "..."));
                        return [4 /*yield*/, this.executeFlow(flows[i])];
                    case 3:
                        account = _a.sent();
                        collected.push(account);
                        console.log("\u2705 Account ".concat(i + 1, "/").concat(count, " collected!\n"));
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("\u274C Failed to collect from ".concat(flows[i].provider, ":"), error_2);
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        // Save all data
                        this.passwordVault.exportVault();
                        this.agentDB.save();
                        console.log("\n\uD83C\uDF8A EMAIL GAUNTLET COMPLETE!");
                        console.log("\uD83D\uDCCA Successfully collected: ".concat(collected.length, "/").concat(count, " accounts"));
                        return [2 /*return*/, collected];
                }
            });
        });
    };
    /**
     * Get all collected accounts
     */
    EmailCollector.prototype.getAccounts = function () {
        return __spreadArray([], this.accounts, true);
    };
    /**
     * Export collected accounts as JSON
     */
    EmailCollector.prototype.exportAccounts = function () {
        var data = {
            version: '1.0.0',
            collectedAt: new Date().toISOString(),
            totalAccounts: this.accounts.length,
            accounts: this.accounts,
            statistics: {
                successRate: this.accounts.filter(function (a) { return a.success; }).length / this.accounts.length,
                captchasSolved: this.accounts.filter(function (a) { return a.captchaSolved; }).length,
                providers: __spreadArray([], new Set(this.accounts.map(function (a) { return a.provider; })), true),
            },
        };
        return JSON.stringify(data, null, 2);
    };
    /**
     * Get collection statistics
     */
    EmailCollector.prototype.getStatistics = function () {
        return {
            totalCollected: this.accounts.length,
            successful: this.accounts.filter(function (a) { return a.success; }).length,
            failed: this.accounts.filter(function (a) { return !a.success; }).length,
            captchasSolved: this.accounts.filter(function (a) { return a.captchaSolved; }).length,
            providers: __spreadArray([], new Set(this.accounts.map(function (a) { return a.provider; })), true),
            successRate: this.accounts.length > 0
                ? this.accounts.filter(function (a) { return a.success; }).length / this.accounts.length
                : 0,
        };
    };
    return EmailCollector;
}());
exports.EmailCollector = EmailCollector;
