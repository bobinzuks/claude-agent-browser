"use strict";
/**
 * CAPTCHA Solver - SECRET BOSS 13
 * Detects and solves CAPTCHAs with AI training and human fallback
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.CAPTCHASolver = exports.SolverStrategy = exports.CAPTCHAType = void 0;
var CAPTCHAType;
(function (CAPTCHAType) {
    CAPTCHAType["NONE"] = "none";
    CAPTCHAType["RECAPTCHA_V2"] = "recaptcha_v2";
    CAPTCHAType["RECAPTCHA_V3"] = "recaptcha_v3";
    CAPTCHAType["HCAPTCHA"] = "hcaptcha";
    CAPTCHAType["IMAGE"] = "image";
    CAPTCHAType["TEXT"] = "text";
    CAPTCHAType["UNKNOWN"] = "unknown";
})(CAPTCHAType || (exports.CAPTCHAType = CAPTCHAType = {}));
var SolverStrategy;
(function (SolverStrategy) {
    SolverStrategy["AI_MODEL"] = "ai_model";
    SolverStrategy["API_SERVICE"] = "api_service";
    SolverStrategy["HUMAN_FALLBACK"] = "human_fallback";
    SolverStrategy["LEARNED_PATTERN"] = "learned_pattern";
})(SolverStrategy || (exports.SolverStrategy = SolverStrategy = {}));
/**
 * CAPTCHASolver - Detects, solves, and learns from CAPTCHAs
 */
var CAPTCHASolver = /** @class */ (function () {
    function CAPTCHASolver(document, config) {
        if (config === void 0) { config = {}; }
        this.currentType = CAPTCHAType.NONE;
        this.currentStrategy = SolverStrategy.AI_MODEL;
        this.patterns = [];
        this.document = document;
        this.config = __assign({ timeout: 30000 }, config);
        this.statistics = {
            attempts: 0,
            successes: 0,
            failures: 0,
            typesCounted: {},
            strategiesUsed: {},
        };
    }
    /**
     * Detect if CAPTCHA is present on the page
     */
    CAPTCHASolver.prototype.detect = function () {
        // Reset current type
        this.currentType = CAPTCHAType.NONE;
        // Check for image CAPTCHA first (most specific)
        var imageCaptcha = this.document.querySelector('img[src*="captcha"], img[alt*="CAPTCHA"], img[alt*="captcha"]');
        if (imageCaptcha) {
            this.currentType = CAPTCHAType.IMAGE;
            this.incrementTypeCount(CAPTCHAType.IMAGE);
            return true;
        }
        // Check for reCAPTCHA v2
        var recaptchaV2 = this.document.querySelector('iframe[src*="google.com/recaptcha/api2/anchor"]');
        if (recaptchaV2) {
            this.currentType = CAPTCHAType.RECAPTCHA_V2;
            this.incrementTypeCount(CAPTCHAType.RECAPTCHA_V2);
            return true;
        }
        // Check for reCAPTCHA v3
        var recaptchaV3 = this.document.querySelector('script[src*="google.com/recaptcha/api.js?render="]');
        if (recaptchaV3) {
            this.currentType = CAPTCHAType.RECAPTCHA_V3;
            this.incrementTypeCount(CAPTCHAType.RECAPTCHA_V3);
            return true;
        }
        // Check for hCaptcha
        var hcaptcha = this.document.querySelector('iframe[src*="hcaptcha.com/captcha"]');
        if (hcaptcha) {
            this.currentType = CAPTCHAType.HCAPTCHA;
            this.incrementTypeCount(CAPTCHAType.HCAPTCHA);
            return true;
        }
        return false;
    };
    /**
     * Get the type of CAPTCHA detected
     */
    CAPTCHASolver.prototype.getCaptchaType = function () {
        return this.currentType;
    };
    /**
     * Attempt to solve the CAPTCHA
     */
    CAPTCHASolver.prototype.solve = function () {
        return __awaiter(this, void 0, void 0, function () {
            var learnedSolution, apiResult, aiSolution;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.statistics.attempts++;
                        if (this.currentType === CAPTCHAType.NONE) {
                            return [2 /*return*/, null];
                        }
                        learnedSolution = this.tryLearnedPattern();
                        if (learnedSolution) {
                            this.currentStrategy = SolverStrategy.LEARNED_PATTERN;
                            this.incrementStrategyCount(SolverStrategy.LEARNED_PATTERN);
                            return [2 /*return*/, learnedSolution];
                        }
                        if (!(this.config.preferredStrategy === SolverStrategy.API_SERVICE && this.config.apiKey)) return [3 /*break*/, 2];
                        this.currentStrategy = SolverStrategy.API_SERVICE;
                        this.incrementStrategyCount(SolverStrategy.API_SERVICE);
                        return [4 /*yield*/, this.solveWithAPI()];
                    case 1:
                        apiResult = _a.sent();
                        return [2 /*return*/, apiResult]; // Return result (or null), don't try other strategies
                    case 2:
                        // Try AI model as default
                        this.currentStrategy = SolverStrategy.AI_MODEL;
                        this.incrementStrategyCount(SolverStrategy.AI_MODEL);
                        return [4 /*yield*/, this.solveWithAI()];
                    case 3:
                        aiSolution = _a.sent();
                        if (aiSolution) {
                            return [2 /*return*/, aiSolution];
                        }
                        // Fallback to human
                        this.currentStrategy = SolverStrategy.HUMAN_FALLBACK;
                        this.incrementStrategyCount(SolverStrategy.HUMAN_FALLBACK);
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Get the current solving strategy
     */
    CAPTCHASolver.prototype.getStrategy = function () {
        return this.currentStrategy;
    };
    /**
     * Try to solve using learned patterns
     */
    CAPTCHASolver.prototype.tryLearnedPattern = function () {
        var _this = this;
        var matchingPatterns = this.patterns.filter(function (p) { var _a, _b; return p.type === _this.currentType && ((_a = p.successCount) !== null && _a !== void 0 ? _a : 0) > ((_b = p.failureCount) !== null && _b !== void 0 ? _b : 0); });
        if (matchingPatterns.length === 0) {
            return null;
        }
        // Sort by success rate and return best
        matchingPatterns.sort(function (a, b) {
            var _a, _b, _c, _d, _e, _f;
            var aRate = ((_a = a.successCount) !== null && _a !== void 0 ? _a : 0) / (((_b = a.successCount) !== null && _b !== void 0 ? _b : 0) + ((_c = a.failureCount) !== null && _c !== void 0 ? _c : 0) || 1);
            var bRate = ((_d = b.successCount) !== null && _d !== void 0 ? _d : 0) / (((_e = b.successCount) !== null && _e !== void 0 ? _e : 0) + ((_f = b.failureCount) !== null && _f !== void 0 ? _f : 0) || 1);
            return bRate - aRate;
        });
        return matchingPatterns[0].solution;
    };
    /**
     * Solve using AI model (placeholder for NopeCHA integration)
     */
    CAPTCHASolver.prototype.solveWithAI = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder: In real implementation, this would integrate with NopeCHA
                // or a trained ML model
                if (this.currentType === CAPTCHAType.RECAPTCHA_V3) {
                    // reCAPTCHA v3 is invisible, would extract token from page
                    return [2 /*return*/, null];
                }
                // For now, return null to trigger human fallback
                return [2 /*return*/, null];
            });
        });
    };
    /**
     * Solve using API service (2Captcha, etc.)
     */
    CAPTCHASolver.prototype.solveWithAPI = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder: In real implementation, this would call 2Captcha API
                return [2 /*return*/, null];
            });
        });
    };
    /**
     * Get CAPTCHA challenge info for human to solve
     */
    CAPTCHASolver.prototype.getChallengeForHuman = function () {
        var _a;
        var challenge = {
            type: this.currentType,
            context: {
                url: ((_a = this.document.location) === null || _a === void 0 ? void 0 : _a.href) || '',
                timestamp: new Date().toISOString(),
            },
        };
        if (this.currentType === CAPTCHAType.IMAGE) {
            var img = this.document.querySelector('img[src*="captcha"], img[alt*="CAPTCHA"]');
            if (img) {
                challenge.imageUrl = img.src;
            }
        }
        if (this.currentType === CAPTCHAType.RECAPTCHA_V2 || this.currentType === CAPTCHAType.HCAPTCHA) {
            var iframe = this.document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
            if (iframe) {
                challenge.url = iframe.src;
                // Extract site key from URL
                var match = iframe.src.match(/[?&]k=([^&]+)/);
                if (match) {
                    challenge.siteKey = match[1];
                }
            }
        }
        return challenge;
    };
    /**
     * Store human solution as training data
     */
    CAPTCHASolver.prototype.storeHumanSolution = function (solution) {
        var _a;
        var pattern = {
            type: this.currentType,
            solution: solution,
            successCount: 0,
            failureCount: 0,
            timestamp: new Date().toISOString(),
            context: {
                url: ((_a = this.document.location) === null || _a === void 0 ? void 0 : _a.href) || '',
                strategy: SolverStrategy.HUMAN_FALLBACK,
            },
        };
        this.patterns.push(pattern);
    };
    /**
     * Mark the last used pattern as successful
     */
    CAPTCHASolver.prototype.markPatternSuccess = function () {
        var _a;
        if (this.patterns.length > 0) {
            var lastPattern = this.patterns[this.patterns.length - 1];
            lastPattern.successCount = ((_a = lastPattern.successCount) !== null && _a !== void 0 ? _a : 0) + 1;
            this.statistics.successes++;
        }
    };
    /**
     * Mark the last used pattern as failed
     */
    CAPTCHASolver.prototype.markPatternFailure = function () {
        var _a;
        if (this.patterns.length > 0) {
            var lastPattern = this.patterns[this.patterns.length - 1];
            lastPattern.failureCount = ((_a = lastPattern.failureCount) !== null && _a !== void 0 ? _a : 0) + 1;
            this.statistics.failures++;
        }
    };
    /**
     * Load a pattern into memory
     */
    CAPTCHASolver.prototype.loadPattern = function (pattern) {
        this.patterns.push(__assign({ successCount: 0, failureCount: 0, timestamp: new Date().toISOString() }, pattern));
    };
    /**
     * Get all stored patterns
     */
    CAPTCHASolver.prototype.getStoredPatterns = function () {
        return __spreadArray([], this.patterns, true);
    };
    /**
     * Export patterns to JSON
     */
    CAPTCHASolver.prototype.exportPatterns = function () {
        return JSON.stringify({
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            patterns: this.patterns,
            statistics: this.statistics,
        }, null, 2);
    };
    /**
     * Import patterns from JSON
     */
    CAPTCHASolver.prototype.importPatterns = function (json) {
        try {
            var data = JSON.parse(json);
            if (data.patterns && Array.isArray(data.patterns)) {
                this.patterns = data.patterns;
            }
        }
        catch (error) {
            throw new Error("Failed to import patterns: ".concat(error));
        }
    };
    /**
     * Clear all patterns
     */
    CAPTCHASolver.prototype.clearPatterns = function () {
        this.patterns = [];
    };
    /**
     * Get solver statistics
     */
    CAPTCHASolver.prototype.getStatistics = function () {
        var totalSuccesses = this.patterns.reduce(function (sum, p) { var _a; return sum + ((_a = p.successCount) !== null && _a !== void 0 ? _a : 0); }, 0);
        var totalFailures = this.patterns.reduce(function (sum, p) { var _a; return sum + ((_a = p.failureCount) !== null && _a !== void 0 ? _a : 0); }, 0);
        var totalPatternAttempts = totalSuccesses + totalFailures;
        return {
            totalAttempts: this.statistics.attempts,
            successRate: totalPatternAttempts > 0 ? totalSuccesses / totalPatternAttempts : 0,
            typesCounted: __assign({}, this.statistics.typesCounted),
            strategiesUsed: __assign({}, this.statistics.strategiesUsed),
        };
    };
    CAPTCHASolver.prototype.incrementTypeCount = function (type) {
        var _a;
        this.statistics.typesCounted[type] = ((_a = this.statistics.typesCounted[type]) !== null && _a !== void 0 ? _a : 0) + 1;
    };
    CAPTCHASolver.prototype.incrementStrategyCount = function (strategy) {
        var _a;
        this.statistics.strategiesUsed[strategy] = ((_a = this.statistics.strategiesUsed[strategy]) !== null && _a !== void 0 ? _a : 0) + 1;
    };
    return CAPTCHASolver;
}());
exports.CAPTCHASolver = CAPTCHASolver;
